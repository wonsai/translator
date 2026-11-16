import { useCallback, useEffect, useRef, useState } from 'react'
import { findInstantGlossaryMatches, type SampleScenario } from '../data/ibGlossary'
import { SAMPLE_OFFLINE_BRIEFINGS } from '../data/sampleBriefings'
import {
  generateTurnBriefing,
  streamLiveTranslation,
  transcribeAudioChunkWithGemini,
} from '../services/geminiService'
import type {
  AudioEngineMode,
  Direction,
  GlossaryItem,
  InterpreterBriefing,
  UtteranceTurn,
} from '../types'

// Web Speech API browser type declarations
interface SpeechRecognitionResultItem {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  [index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionResultList {
  readonly length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
  readonly message?: string
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
}

export function isWebSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
}

interface UseSpeechInterpreterOptions {
  apiKey: string
  selectedModel: string
  audioEngine: AudioEngineMode
  enableInterimTranslation: boolean
  glossary: GlossaryItem[]
}

export function useSpeechInterpreter({
  apiKey,
  selectedModel,
  audioEngine,
  enableInterimTranslation,
  glossary,
}: UseSpeechInterpreterOptions) {
  const [direction, setDirectionState] = useState<Direction>('EN_TO_KO')
  const [isListening, setIsListening] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)

  const [turns, setTurns] = useState<UtteranceTurn[]>([])
  const [selectedTurnId, setSelectedTurnId] = useState<string | null>(null)
  const [contextBriefing, setContextBriefing] = useState<InterpreterBriefing | null>(null)
  const [isGeneratingContextBriefing, setIsGeneratingContextBriefing] = useState(false)

  // Mutable refs for real-time speech callbacks
  const directionRef = useRef<Direction>(direction)
  const apiKeyRef = useRef(apiKey)
  const modelRef = useRef(selectedModel)
  const glossaryRef = useRef(glossary)
  const interimTransEnabledRef = useRef(enableInterimTranslation)

  useEffect(() => {
    directionRef.current = direction
    apiKeyRef.current = apiKey
    modelRef.current = selectedModel
    glossaryRef.current = glossary
    interimTransEnabledRef.current = enableInterimTranslation
  }, [apiKey, direction, enableInterimTranslation, glossary, selectedModel])

  const shouldListenRef = useRef(false)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)

  // Current active turn tracking
  const activeTurnIdRef = useRef<string | null>(null)
  const committedTurnTextRef = useRef('')
  const currentInterimTextRef = useRef('')
  const processedResultIndexRef = useRef(0)

  // Timers & abort controllers
  const interimDebounceTimerRef = useRef<number | null>(null)
  const briefingDebounceTimerRef = useRef<number | null>(null)
  const autoTurnSplitTimerRef = useRef<number | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const lastTranslatedSnapshotRef = useRef('')

  // Audio meter & MediaRecorder refs
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const meterFrameRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunkIntervalRef = useRef<number | null>(null)
  const chunkPeakEnergyRef = useRef(0)

  const createNewTurnObject = useCallback((dir: Direction, initialText = ''): UtteranceTurn => {
    const id = `turn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    return {
      id,
      direction: dir,
      createdAt: Date.now(),
      sourceText: initialText,
      translatedText: '',
      isInterim: true,
      isTranslating: false,
      isSummarizing: false,
      instantGlossaryHits: initialText
        ? findInstantGlossaryMatches(initialText, dir, glossaryRef.current)
        : [],
    }
  }, [])

  const runBriefingForTurn = useCallback(
    async (turnId: string, textToAnalyze: string, dir: Direction) => {
      const clean = textToAnalyze.trim()
      if (!clean || !apiKeyRef.current.trim()) return

      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, isSummarizing: true, error: undefined } : t))
      )

      try {
        const { refinedTranslation, briefing } = await generateTurnBriefing({
          apiKey: apiKeyRef.current,
          selectedModel: modelRef.current,
          direction: dir,
          sourceText: clean,
          glossary: glossaryRef.current,
          scopeCount: 1,
        })

        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  translatedText: refinedTranslation || t.translatedText,
                  briefing,
                  isSummarizing: false,
                  isTranslating: false,
                }
              : t
          )
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'AI 요약 생성 중 오류가 발생했습니다.'
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId ? { ...t, isSummarizing: false, isTranslating: false, error: message } : t
          )
        )
      }
    },
    []
  )

  const runLiveStreamTranslation = useCallback(
    async (turnId: string, textToTranslate: string, dir: Direction) => {
      const clean = textToTranslate.trim()
      if (!clean || !apiKeyRef.current.trim()) return
      if (lastTranslatedSnapshotRef.current === `${turnId}::${clean}`) return
      lastTranslatedSnapshotRef.current = `${turnId}::${clean}`

      streamAbortRef.current?.abort()
      const controller = new AbortController()
      streamAbortRef.current = controller

      setTurns((prev) =>
        prev.map((t) => (t.id === turnId ? { ...t, isTranslating: true, error: undefined } : t))
      )

      try {
        await streamLiveTranslation({
          apiKey: apiKeyRef.current,
          selectedModel: modelRef.current,
          direction: dir,
          sourceText: clean,
          glossary: glossaryRef.current,
          signal: controller.signal,
          onChunk: (partial) => {
            setTurns((prev) =>
              prev.map((t) => (t.id === turnId ? { ...t, translatedText: partial } : t))
            )
          },
        })

        setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, isTranslating: false } : t))
        )
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        const message = err instanceof Error ? err.message : '실시간 번역 실패'
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId ? { ...t, isTranslating: false, error: message } : t
          )
        )
      }
    },
    []
  )

  /**
   * Finalizes the current active turn so the next speech starts a fresh card
   * and immediately generates/updates the structured AI Interpreter Briefing.
   */
  const finalizeCurrentTurn = useCallback(() => {
    if (interimDebounceTimerRef.current) {
      window.clearTimeout(interimDebounceTimerRef.current)
      interimDebounceTimerRef.current = null
    }
    if (briefingDebounceTimerRef.current) {
      window.clearTimeout(briefingDebounceTimerRef.current)
      briefingDebounceTimerRef.current = null
    }
    if (autoTurnSplitTimerRef.current) {
      window.clearTimeout(autoTurnSplitTimerRef.current)
      autoTurnSplitTimerRef.current = null
    }

    const turnId = activeTurnIdRef.current
    if (!turnId) return

    const fullText = `${committedTurnTextRef.current} ${currentInterimTextRef.current}`
      .replace(/\s+/g, ' ')
      .trim()

    activeTurnIdRef.current = null
    committedTurnTextRef.current = ''
    currentInterimTextRef.current = ''

    if (!fullText) {
      setTurns((prev) => prev.filter((t) => t.id !== turnId))
      return
    }

    const dir = directionRef.current
    const hits = findInstantGlossaryMatches(fullText, dir, glossaryRef.current)

    setTurns((prev) =>
      prev.map((t) =>
        t.id === turnId
          ? {
              ...t,
              sourceText: fullText,
              isInterim: false,
              instantGlossaryHits: hits,
            }
          : t
      )
    )
    setSelectedTurnId(turnId)

    if (apiKeyRef.current.trim()) {
      void runBriefingForTurn(turnId, fullText, dir)
    }
  }, [runBriefingForTurn])

  const stopAudioMeterAndStream = useCallback(() => {
    if (meterFrameRef.current) {
      cancelAnimationFrame(meterFrameRef.current)
      meterFrameRef.current = null
    }
    if (chunkIntervalRef.current) {
      window.clearInterval(chunkIntervalRef.current)
      chunkIntervalRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setAudioLevel(0)
  }, [])

  const attachAudioMeter = useCallback(async (existingStream?: MediaStream) => {
    try {
      const stream =
        existingStream ||
        (await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }))
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const tick = () => {
        if (!shouldListenRef.current) return
        analyser.getByteTimeDomainData(dataArray)
        let sumSq = 0
        for (let i = 0; i < dataArray.length; i++) {
          const centered = (dataArray[i] - 128) / 128
          sumSq += centered * centered
        }
        const rms = Math.sqrt(sumSq / dataArray.length)
        if (rms > chunkPeakEnergyRef.current) {
          chunkPeakEnergyRef.current = rms
        }
        const normalized = Math.min(1, rms * 4.2)
        setAudioLevel(normalized)
        meterFrameRef.current = requestAnimationFrame(tick)
      }

      meterFrameRef.current = requestAnimationFrame(tick)
      return stream
    } catch {
      // Non-fatal for Web Speech mode if audio meter stream cannot open separately
      return null
    }
  }, [])

  const startWebSpeechEngine = useCallback(function launchSpeechSession(dir: Direction) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      setMicError('이 브라우저는 실시간 Web Speech 인식을 지원하지 않습니다. 설정에서 Gemini 음성인식 모드를 선택해 주세요.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      try {
        recognitionRef.current.abort()
      } catch {
        // ignore
      }
    }

    const recognition = new SpeechRec()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = dir === 'EN_TO_KO' ? 'en-US' : 'ko-KR'
    processedResultIndexRef.current = 0

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newlyFinalized = ''
      let interim = ''

      for (let i = processedResultIndexRef.current; i < event.results.length; i++) {
        const res = event.results[i]
        const transcriptPiece = res[0]?.transcript || ''
        if (res.isFinal) {
          newlyFinalized += ` ${transcriptPiece}`
          processedResultIndexRef.current = i + 1
        } else {
          interim += transcriptPiece
        }
      }

      if (newlyFinalized.trim()) {
        committedTurnTextRef.current = `${committedTurnTextRef.current} ${newlyFinalized}`
          .replace(/\s+/g, ' ')
          .trim()
      }
      currentInterimTextRef.current = interim.trim()

      const combinedText = `${committedTurnTextRef.current} ${currentInterimTextRef.current}`
        .replace(/\s+/g, ' ')
        .trim()

      if (!combinedText) return

      // Ensure an active turn card exists
      let turnId = activeTurnIdRef.current
      if (!turnId) {
        const fresh = createNewTurnObject(dir, combinedText)
        turnId = fresh.id
        activeTurnIdRef.current = turnId
        setTurns((prev) => [...prev, fresh])
        setSelectedTurnId(turnId)
      } else {
        const instantHits = findInstantGlossaryMatches(combinedText, dir, glossaryRef.current)
        setTurns((prev) =>
          prev.map((t) =>
            t.id === turnId
              ? {
                  ...t,
                  sourceText: combinedText,
                  isInterim: true,
                  instantGlossaryHits: instantHits,
                }
              : t
          )
        )
      }

      // Live translation while speaking (debounced interim)
      if (interimTransEnabledRef.current && apiKeyRef.current.trim() && currentInterimTextRef.current) {
        if (!interimDebounceTimerRef.current) {
          interimDebounceTimerRef.current = window.setTimeout(() => {
            interimDebounceTimerRef.current = null
            const activeId = activeTurnIdRef.current
            const latestText = `${committedTurnTextRef.current} ${currentInterimTextRef.current}`
              .replace(/\s+/g, ' ')
              .trim()
            if (activeId && latestText.length >= 8) {
              void runLiveStreamTranslation(activeId, latestText, directionRef.current)
            }
          }, 1250)
        }
      }

      // When a phrase/sentence finalizes: immediately stream translation & schedule AI briefing
      if (newlyFinalized.trim()) {
        const capturedTurnId = turnId
        if (apiKeyRef.current.trim()) {
          void runLiveStreamTranslation(capturedTurnId, combinedText, dir)

          if (briefingDebounceTimerRef.current) {
            window.clearTimeout(briefingDebounceTimerRef.current)
          }
          briefingDebounceTimerRef.current = window.setTimeout(() => {
            const latestCommitted = committedTurnTextRef.current.trim()
            if (latestCommitted) {
              void runBriefingForTurn(capturedTurnId, latestCommitted, dir)
            }
          }, 750)
        }

        // Auto-split turn cleanly if speaker pauses for 3.5s or turn grows past ~320 chars
        if (autoTurnSplitTimerRef.current) {
          window.clearTimeout(autoTurnSplitTimerRef.current)
        }
        if (committedTurnTextRef.current.length >= 320 && !currentInterimTextRef.current) {
          finalizeCurrentTurn()
        } else {
          autoTurnSplitTimerRef.current = window.setTimeout(() => {
            if (!currentInterimTextRef.current && committedTurnTextRef.current) {
              finalizeCurrentTurn()
            }
          }, 3500)
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return
      }
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListenRef.current = false
        setIsListening(false)
        stopAudioMeterAndStream()
        setMicError('마이크 접근 권한이 거부되었습니다. 브라우저 주소창 왼쪽 권한 설정에서 마이크를 허용해 주세요.')
      } else {
        setMicError(`음성 인식 알림: ${event.error}`)
      }
    }

    recognition.onend = () => {
      // Seamlessly auto-restart if user hasn't paused listening
      if (shouldListenRef.current && recognitionRef.current === recognition) {
        processedResultIndexRef.current = 0
        try {
          recognition.start()
        } catch {
          window.setTimeout(() => {
            if (shouldListenRef.current) {
              launchSpeechSession(directionRef.current)
            }
          }, 180)
        }
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setMicError('음성 인식을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }, [createNewTurnObject, finalizeCurrentTurn, runBriefingForTurn, runLiveStreamTranslation, stopAudioMeterAndStream])

  const startGeminiAudioEngine = useCallback(
    async (dir: Direction) => {
      if (!apiKeyRef.current.trim()) {
        shouldListenRef.current = false
        setIsListening(false)
        setMicError('Gemini 직접 음성인식 모드를 사용하려면 상단 [API 설정]에서 Gemini API 키를 먼저 입력해 주세요.')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        await attachAudioMeter(stream)

        const supportedMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''

        const recordSingleSlice = () => {
          if (!shouldListenRef.current || !mediaStreamRef.current) return
          chunkPeakEnergyRef.current = 0
          const chunks: BlobPart[] = []
          const recorder = supportedMime
            ? new MediaRecorder(mediaStreamRef.current, { mimeType: supportedMime })
            : new MediaRecorder(mediaStreamRef.current)

          mediaRecorderRef.current = recorder
          recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0) chunks.push(ev.data)
          }

          recorder.onstop = async () => {
            const peak = chunkPeakEnergyRef.current
            if (!chunks.length || peak < 0.014) return // skip silent chunk

            const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
            const base64Audio = await blobToBase64(blob)
            if (!base64Audio) return

            try {
              const { transcript, translation } = await transcribeAudioChunkWithGemini({
                apiKey: apiKeyRef.current,
                selectedModel: modelRef.current,
                direction: dir,
                base64Audio,
                mimeType: (recorder.mimeType || 'audio/webm').split(';')[0],
                glossary: glossaryRef.current,
              })

              if (!transcript.trim()) return

              committedTurnTextRef.current = `${committedTurnTextRef.current} ${transcript}`
                .replace(/\s+/g, ' ')
                .trim()
              const combined = committedTurnTextRef.current
              const hits = findInstantGlossaryMatches(combined, dir, glossaryRef.current)

              let turnId = activeTurnIdRef.current
              if (!turnId) {
                const fresh = createNewTurnObject(dir, combined)
                fresh.translatedText = translation
                fresh.instantGlossaryHits = hits
                turnId = fresh.id
                activeTurnIdRef.current = turnId
                setTurns((prev) => [...prev, fresh])
                setSelectedTurnId(turnId)
              } else {
                setTurns((prev) =>
                  prev.map((t) =>
                    t.id === turnId
                      ? {
                          ...t,
                          sourceText: combined,
                          translatedText: t.translatedText
                            ? `${t.translatedText} ${translation}`.trim()
                            : translation,
                          instantGlossaryHits: hits,
                        }
                      : t
                  )
                )
              }

              void runBriefingForTurn(turnId, combined, dir)

              if (combined.length >= 300) {
                finalizeCurrentTurn()
              }
            } catch (err) {
              setMicError(err instanceof Error ? err.message : '오디오 분석 실패')
            }
          }

          recorder.start()
          window.setTimeout(() => {
            if (recorder.state === 'recording') {
              try {
                recorder.stop()
              } catch {
                // ignore
              }
            }
          }, 4200)
        }

        recordSingleSlice()
        chunkIntervalRef.current = window.setInterval(() => {
          if (shouldListenRef.current) {
            recordSingleSlice()
          }
        }, 4350)
      } catch {
        shouldListenRef.current = false
        setIsListening(false)
        setMicError('마이크를 열 수 없습니다. 브라우저 마이크 권한을 확인해 주세요.')
      }
    },
    [attachAudioMeter, createNewTurnObject, finalizeCurrentTurn, runBriefingForTurn]
  )

  const startListening = useCallback(
    async (overrideDir?: Direction) => {
      const targetDir = overrideDir || directionRef.current
      setMicError(null)
      shouldListenRef.current = true
      setIsListening(true)

      const effectiveEngine: AudioEngineMode =
        audioEngine === 'web_speech' && isWebSpeechSupported() ? 'web_speech' : 'gemini_audio'

      if (effectiveEngine === 'web_speech') {
        startWebSpeechEngine(targetDir)
        void attachAudioMeter()
      } else {
        await startGeminiAudioEngine(targetDir)
      }
    },
    [attachAudioMeter, audioEngine, startGeminiAudioEngine, startWebSpeechEngine]
  )

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    setIsListening(false)

    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }

    stopAudioMeterAndStream()
    finalizeCurrentTurn()
  }, [finalizeCurrentTurn, stopAudioMeterAndStream])

  const toggleListening = useCallback(() => {
    if (shouldListenRef.current) {
      stopListening()
    } else {
      void startListening()
    }
  }, [startListening, stopListening])

  const switchDirection = useCallback(
    (nextDirection: Direction) => {
      if (nextDirection === directionRef.current) return

      const wasListening = shouldListenRef.current
      if (wasListening) {
        // Stop current recognizer, finalize pending speech in previous language, then start new language immediately
        if (recognitionRef.current) {
          recognitionRef.current.onend = null
          try {
            recognitionRef.current.abort()
          } catch {
            // ignore
          }
          recognitionRef.current = null
        }
        stopAudioMeterAndStream()
      }

      finalizeCurrentTurn()
      directionRef.current = nextDirection
      setDirectionState(nextDirection)

      if (wasListening) {
        window.setTimeout(() => {
          void startListening(nextDirection)
        }, 90)
      }
    },
    [finalizeCurrentTurn, startListening, stopAudioMeterAndStream]
  )

  /**
   * Manual text input or Sample Evaluation Scenario simulation
   */
  const submitManualOrSampleUtterance = useCallback(
    async (text: string, dirOverride?: Direction, sampleMeta?: SampleScenario) => {
      const clean = text.trim()
      if (!clean) return

      const dir = dirOverride || directionRef.current
      if (dir !== directionRef.current && !shouldListenRef.current) {
        directionRef.current = dir
        setDirectionState(dir)
      }

      const turn = createNewTurnObject(dir, clean)
      turn.isInterim = false
      const id = turn.id

      // If no API key is configured yet and user clicked a built-in sample scenario, show offline preview immediately
      if (!apiKeyRef.current.trim() && sampleMeta) {
        turn.translatedText = sampleMeta.fallbackTranslation
        turn.briefing = SAMPLE_OFFLINE_BRIEFINGS[sampleMeta.id]
        setTurns((prev) => [...prev, turn])
        setSelectedTurnId(id)
        return
      }

      setTurns((prev) => [...prev, turn])
      setSelectedTurnId(id)

      if (!apiKeyRef.current.trim()) {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  error:
                    '우측 상단 [API 설정]에서 Gemini API 키를 연결하면 실시간 번역과 핵심 요약이 생성됩니다. (하단 IB 용어 자동 감지는 즉시 작동 중입니다.)',
                }
              : t
          )
        )
        return
      }

      void runLiveStreamTranslation(id, clean, dir)
      void runBriefingForTurn(id, clean, dir)
    },
    [createNewTurnObject, runBriefingForTurn, runLiveStreamTranslation]
  )

  /**
   * Summarize recent multiple turns together (rolling context mode)
   */
  const summarizeRecentContext = useCallback(async () => {
    if (!apiKeyRef.current.trim() || turns.length === 0) return
    const recent = turns.slice(-3)
    const lastDir = recent[recent.length - 1].direction
    const combinedSource = recent
      .map(
        (t, idx) =>
          `[발화 ${idx + 1} (${t.direction === 'EN_TO_KO' ? '영어→한국어' : '한국어→영어'})] ${t.sourceText}`
      )
      .join('\n')

    setIsGeneratingContextBriefing(true)
    try {
      const { briefing } = await generateTurnBriefing({
        apiKey: apiKeyRef.current,
        selectedModel: modelRef.current,
        direction: lastDir,
        sourceText: combinedSource,
        glossary: glossaryRef.current,
        scopeCount: recent.length,
      })
      setContextBriefing(briefing)
    } catch (err) {
      setMicError(err instanceof Error ? err.message : '누적 요약 생성 실패')
    } finally {
      setIsGeneratingContextBriefing(false)
    }
  }, [turns])

  const clearAllTurns = useCallback(() => {
    finalizeCurrentTurn()
    setTurns([])
    setSelectedTurnId(null)
    setContextBriefing(null)
  }, [finalizeCurrentTurn])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      recognitionRef.current?.abort()
      stopAudioMeterAndStream()
    }
  }, [stopAudioMeterAndStream])

  return {
    direction,
    isListening,
    audioLevel,
    micError,
    setMicError,
    turns,
    selectedTurnId,
    setSelectedTurnId,
    contextBriefing,
    setContextBriefing,
    isGeneratingContextBriefing,
    toggleListening,
    stopListening,
    switchDirection,
    finalizeCurrentTurn,
    submitManualOrSampleUtterance,
    runBriefingForTurn,
    summarizeRecentContext,
    clearAllTurns,
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = String(reader.result || '')
      const commaIdx = result.indexOf(',')
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : '')
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(blob)
  })
}
