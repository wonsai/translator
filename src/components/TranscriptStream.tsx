import {
  Check,
  Copy,
  Download,
  Mic,
  PlayCircle,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SAMPLE_EVALUATION_SCENARIOS, type SampleScenario } from '../data/ibGlossary'
import type { AudioEngineMode, Direction, UtteranceTurn } from '../types'

interface TranscriptStreamProps {
  direction: Direction
  isListening: boolean
  audioLevel: number
  audioEngine: AudioEngineMode
  micError: string | null
  turns: UtteranceTurn[]
  selectedTurnId: string | null
  hasApiKey: boolean
  mobileHidden?: boolean
  onSelectTurn: (id: string) => void
  onManualSubmit: (text: string, dirOverride?: Direction, sample?: SampleScenario) => void
  onRetryBriefing: (turn: UtteranceTurn) => void
  onClearAll: () => void
  onDismissError: () => void
}

export function TranscriptStream({
  direction,
  isListening,
  audioLevel,
  audioEngine,
  micError,
  turns,
  selectedTurnId,
  hasApiKey,
  mobileHidden,
  onSelectTurn,
  onManualSubmit,
  onRetryBriefing,
  onClearAll,
  onDismissError,
}: TranscriptStreamProps) {
  const [manualText, setManualText] = useState('')
  const [showDemoBar, setShowDemoBar] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll smoothly when new speech arrives
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 180
    if (nearBottom || isListening) {
      el.scrollTop = el.scrollHeight
    }
  }, [turns, isListening])

  const handleManualFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualText.trim()) return
    onManualSubmit(manualText)
    setManualText('')
  }

  const handleCopyTurn = (e: React.MouseEvent, turn: UtteranceTurn) => {
    e.stopPropagation()
    const content = `[${turn.direction === 'EN_TO_KO' ? 'EN → KO' : 'KO → EN'}]\n원문: ${turn.sourceText}\n번역: ${turn.translatedText || '(번역 대기)'}`
    void navigator.clipboard.writeText(content)
    setCopiedId(turn.id)
    window.setTimeout(() => setCopiedId(null), 1500)
  }

  const handleExportMarkdown = () => {
    if (!turns.length) return
    const header = `# 표선고등학교 IB 평가 방문 통역 기록\n생성 일시: ${new Date().toLocaleString('ko-KR')}\n\n---\n\n`
    const body = turns
      .map((t, i) => {
        const time = new Date(t.createdAt).toLocaleTimeString('ko-KR')
        const dirLabel = t.direction === 'EN_TO_KO' ? '영어 → 한국어 (평가단)' : '한국어 → 영어 (학교측)'
        const summaryLines = t.briefing?.bulletPoints
          ?.map((b) => `  - ${b.koSummary} → *${b.targetCue}*`)
          .join('\n')
        return `### ${i + 1}. [${dirLabel}] (${time})\n- **받아쓰기 원문**: ${t.sourceText}\n- **실시간 번역**: ${t.translatedText || '-'}${summaryLines ? `\n- **핵심 통역 노트**:\n${summaryLines}` : ''}`
      })
      .join('\n\n')

    const blob = new Blob([header + body], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `표선고_IB평가방문_통역기록_${new Date().toISOString().slice(0, 10)}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const barHeights = [0.35, 0.7, 1, 0.8, 0.45].map((weight) => {
    if (!isListening) return 4
    return Math.max(4, Math.round(4 + audioLevel * 12 * weight))
  })

  return (
    <section
      className={`desk-pane ${mobileHidden ? 'mobile-hidden' : ''}`}
      id="pane-transcript-stream"
      aria-label="실시간 받아쓰기 및 직독 번역"
    >
      <div className="pane-header">
        <div className="pane-title-group">
          <h2>실시간 받아쓰기 & 직독 번역</h2>
          <span className="pane-caption">원문 아래에 반대 언어 번역이 실시간 표시됩니다</span>
        </div>
        <div className="pane-actions">
          <button
            id="btn-toggle-demo-strip"
            type="button"
            className={`mini-btn ${showDemoBar ? 'active' : ''}`}
            onClick={() => setShowDemoBar((v) => !v)}
          >
            <PlayCircle size={13} />
            <span>리허설 샘플</span>
          </button>
          <button
            id="btn-export-log"
            type="button"
            className="mini-btn"
            disabled={turns.length === 0}
            onClick={handleExportMarkdown}
            title="전체 받아쓰기·번역·요약 기록을 마크다운 파일로 저장합니다"
          >
            <Download size={13} />
            <span>기록 저장</span>
          </button>
          <button
            id="btn-clear-turns"
            type="button"
            className="mini-btn"
            disabled={turns.length === 0}
            onClick={onClearAll}
            title="현재 세션 기록 비우기"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Live Audio & Direction Status Strip */}
      <div className="live-status-strip">
        <div className="status-indicator">
          <div className="audio-meter" aria-hidden="true">
            {barHeights.map((h, idx) => (
              <span
                key={idx}
                className={`audio-bar ${isListening && audioLevel > 0.04 ? 'active' : ''}`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <span>
            {isListening
              ? direction === 'EN_TO_KO'
                ? '영어 발화 실시간 수신 중 (English → 한국어)'
                : '한국어 발화 실시간 수신 중 (한국어 → English)'
              : '대기 중 · 상단 [실시간 듣기 시작] 또는 Space 키를 누르세요'}
          </span>
        </div>

        <span className={`direction-pill ${direction === 'EN_TO_KO' ? 'en' : 'ko'}`}>
          {direction === 'EN_TO_KO' ? 'EN → KO 모드' : 'KO → EN 모드'} ·{' '}
          {audioEngine === 'web_speech' ? '초고속 스트리밍' : 'Gemini 오디오'}
        </span>
      </div>

      {/* Rehearsal / Sample Scenario Strip */}
      {showDemoBar && (
        <div className="demo-strip" role="region" aria-label="표선고 평가 방문 실전 시연 샘플">
          <span className="demo-strip-label">실전 리허설 시연:</span>
          {SAMPLE_EVALUATION_SCENARIOS.map((sample) => (
            <button
              key={sample.id}
              id={`btn-${sample.id}`}
              type="button"
              className="demo-chip"
              onClick={() => onManualSubmit(sample.text, sample.direction, sample)}
            >
              {sample.label}
            </button>
          ))}
        </div>
      )}

      {micError && (
        <div
          className="status-banner warn"
          style={{ margin: '10px 18px 0', display: 'flex', justifyContent: 'space-between', gap: 8 }}
        >
          <span>{micError}</span>
          <button
            type="button"
            onClick={onDismissError}
            style={{ fontWeight: 700, textDecoration: 'underline', flexShrink: 0 }}
          >
            닫기
          </button>
        </div>
      )}

      {/* Main Utterance Feed */}
      <div className="transcript-scroll" ref={scrollContainerRef}>
        {turns.length === 0 ? (
          <div className="empty-desk-state">
            <div className="empty-desk-icon">
              <Mic size={22} />
            </div>
            <h3>실시간 한·영 / 영·한 받아쓰기 준비 완료</h3>
            <p>
              평가단이 영어로 질문할 때는 <strong>영 → 한 듣기</strong>를, 표선고 교원·학생이
              한국어로 답변할 때는 <strong>한 → 영 듣기</strong>를 선택하세요. 원문 바로 아래에
              실시간 번역이 표시되고, 우측에는 통역용 핵심 요점과 반대 언어 단어장이 정리됩니다.
            </p>
            <div className="shortcut-hints">
              <span>
                <kbd>Alt+1</kbd> 영→한 전환
              </span>
              <span>
                <kbd>Alt+2</kbd> 한→영 전환
              </span>
              <span>
                <kbd>Space</kbd> 마이크 시작/정지
              </span>
              <span>
                <kbd>Enter</kbd> 발화 구간 완료
              </span>
            </div>
          </div>
        ) : (
          turns.map((turn) => {
            const isSelected = turn.id === selectedTurnId
            const isEn = turn.direction === 'EN_TO_KO'
            const timeStr = new Date(turn.createdAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            return (
              <article
                key={turn.id}
                className={`utterance-card ${isSelected ? 'is-selected' : ''} ${turn.isInterim ? 'is-live-turn' : ''}`}
                onClick={() => onSelectTurn(turn.id)}
              >
                <div className="utterance-meta">
                  <div className="utterance-meta-left">
                    <span className={`direction-pill ${isEn ? 'en' : 'ko'}`}>
                      {isEn ? '영어 발화 → 한국어' : '한국어 발화 → 영어'}
                    </span>
                    <span className="utterance-time">{timeStr}</span>
                    {turn.isInterim && (
                      <span className="live-listening-badge">실시간 받아쓰기 중</span>
                    )}
                  </div>

                  <div className="pane-actions">
                    {hasApiKey && !turn.isInterim && (
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRetryBriefing(turn)
                        }}
                        title="이 발화의 AI 통역 노트를 다시 정리합니다"
                      >
                        <RefreshCw size={12} />
                        <span>노트 갱신</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={(e) => handleCopyTurn(e, turn)}
                      title="원문과 번역 복사"
                    >
                      {copiedId === turn.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* 1) Real-time Source Dictation */}
                <div className="source-dictation">
                  {turn.sourceText}
                  {turn.isInterim && <span className="live-caret" aria-hidden="true" />}
                </div>

                {/* 2) Real-time Translation Directly Underneath */}
                <div className={`sub-translation ${isEn ? 'dir-en' : 'dir-ko'}`}>
                  <div className="sub-translation-label">
                    <span>{isEn ? '실시간 한국어 번역' : 'Live English Translation'}</span>
                    {turn.isTranslating && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Sparkles size={11} /> 실시간 번역 중...
                      </span>
                    )}
                  </div>
                  {turn.translatedText ? (
                    <div>{turn.translatedText}</div>
                  ) : turn.error ? (
                    <div className="translating-shimmer">{turn.error}</div>
                  ) : hasApiKey ? (
                    <div className="translating-shimmer">
                      {turn.isInterim
                        ? '발화 맥락에 맞춰 실시간 번역을 생성하고 있습니다...'
                        : '번역 정리 중...'}
                    </div>
                  ) : (
                    <div className="translating-shimmer">
                      상단 [API 키 연동] 후 실시간 AI 직독 번역이 여기에 표시됩니다.
                    </div>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>

      {/* Bottom Manual Input Composer */}
      <form className="manual-composer" onSubmit={handleManualFormSubmit}>
        <input
          id="input-manual-utterance"
          type="text"
          className="manual-input"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder={
            direction === 'EN_TO_KO'
              ? '영어 문장을 직접 입력해 번역·핵심 요약을 테스트하거나 보충할 수 있습니다...'
              : '한국어 문장을 직접 입력해 영문 통역 핵심 표현·요약을 바로 확인할 수 있습니다...'
          }
        />
        <button
          id="btn-submit-manual"
          type="submit"
          className="send-manual-btn"
          disabled={!manualText.trim()}
        >
          <Send size={14} />
          <span>즉시 분석</span>
        </button>
      </form>
    </section>
  )
}
