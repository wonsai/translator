import { findInstantGlossaryMatches } from '../data/ibGlossary'
import type {
  CheckpointSummaryRecord,
  Direction,
  GeminiModelOption,
  GlossaryItem,
  InterpreterBriefing,
  KeyTermPair,
} from '../types'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

// Ordered for lowest latency + high accuracy in live interpretation (2026 Gemini lineup + legacy fallbacks)
const PREFERRED_MODEL_ORDER = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
]

const EXCLUDED_MODEL_KEYWORDS = [
  'tts',
  'image',
  'imagen',
  'veo',
  'embedding',
  'aqa',
  'bisheng',
  'computer-use',
  'robotics',
  'thinking-exp',
  'live',
]

let cachedResolvedAutoModel: string | null = null

export const FALLBACK_MODEL_OPTIONS: GeminiModelOption[] = [
  {
    id: 'auto',
    displayName: '자동 최적 선택 (실시간 초고속 Flash 우선)',
    description: 'API 키에서 사용 가능한 가장 빠르고 정확한 Flash 모델을 자동 연결합니다.',
  },
  {
    id: 'gemini-3.5-flash-lite',
    displayName: 'Gemini 3.5 Flash-Lite (초저지연 실시간 권장)',
  },
  {
    id: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash (속도·정확도 균형)',
  },
  {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash (고정밀 문맥 추론)',
  },
]

function isSuitableTextModel(modelName: string, methods: string[] = []): boolean {
  if (!methods.includes('generateContent')) return false
  const lower = modelName.toLowerCase()
  if (!lower.includes('gemini')) return false
  return !EXCLUDED_MODEL_KEYWORDS.some((kw) => lower.includes(kw))
}

export async function verifyAndDiscoverModels(apiKey: string): Promise<{
  models: GeminiModelOption[]
  recommendedModel: string
}> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new Error('Gemini API 키를 입력해 주세요.')
  }

  const response = await fetch(`${GEMINI_API_BASE}/models`, {
    method: 'GET',
    headers: {
      'x-goog-api-key': trimmedKey,
    },
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => null)
    const msg =
      errBody?.error?.message || `API 키 확인에 실패했습니다 (HTTP ${response.status}).`
    throw new Error(msg)
  }

  const data = (await response.json()) as {
    models?: Array<{
      name: string
      displayName?: string
      description?: string
      supportedGenerationMethods?: string[]
    }>
  }

  const discovered: GeminiModelOption[] = (data.models || [])
    .filter((m) => isSuitableTextModel(m.name, m.supportedGenerationMethods))
    .map((m) => {
      const id = m.name.replace(/^models\//, '')
      return {
        id,
        displayName: m.displayName ? `${m.displayName} (${id})` : id,
        description: m.description,
      }
    })

  discovered.sort((a, b) => {
    const idxA = PREFERRED_MODEL_ORDER.indexOf(a.id)
    const idxB = PREFERRED_MODEL_ORDER.indexOf(b.id)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    const aFlash = a.id.includes('flash') ? 0 : 1
    const bFlash = b.id.includes('flash') ? 0 : 1
    if (aFlash !== bFlash) return aFlash - bFlash
    return b.id.localeCompare(a.id)
  })

  const recommended =
    discovered.find((m) => PREFERRED_MODEL_ORDER.includes(m.id))?.id ||
    discovered.find((m) => m.id.includes('flash'))?.id ||
    discovered[0]?.id ||
    'gemini-3.6-flash'

  cachedResolvedAutoModel = recommended

  return {
    models: [
      {
        id: 'auto',
        displayName: `자동 최적 선택 (현재 연결: ${recommended})`,
      },
      ...discovered,
    ],
    recommendedModel: recommended,
  }
}

async function resolveActiveModel(apiKey: string, selectedModel: string): Promise<string> {
  if (selectedModel && selectedModel !== 'auto') {
    return selectedModel
  }
  if (cachedResolvedAutoModel) {
    return cachedResolvedAutoModel
  }
  try {
    const { recommendedModel } = await verifyAndDiscoverModels(apiKey)
    return recommendedModel
  } catch {
    return 'gemini-3.6-flash'
  }
}

function buildGlossaryPromptContext(glossary: GlossaryItem[], sourceText: string): string {
  const lower = sourceText.toLowerCase()
  const relevant = glossary.filter((item) => {
    const enMatch = lower.includes(item.en.toLowerCase().slice(0, 8))
    const koBase = item.ko.replace(/\s*\([^)]*\)/g, '').trim()
    const koMatch = sourceText.includes(koBase.slice(0, 3))
    const abbrMatch = item.abbr ? lower.includes(item.abbr.toLowerCase()) : false
    return enMatch || koMatch || abbrMatch
  })

  const selected = relevant.length >= 6 ? relevant.slice(0, 20) : glossary.slice(0, 26)
  return selected
    .map((g) => `- ${g.en}${g.abbr ? ` (${g.abbr})` : ''} ↔ ${g.ko}`)
    .join('\n')
}

/**
 * Streams fast live translation directly underneath the real-time dictation.
 */
export async function streamLiveTranslation(params: {
  apiKey: string
  selectedModel: string
  direction: Direction
  sourceText: string
  glossary: GlossaryItem[]
  signal?: AbortSignal
  onChunk: (partialText: string) => void
}): Promise<string> {
  const { apiKey, selectedModel, direction, sourceText, glossary, signal, onChunk } = params
  const trimmedKey = apiKey.trim()
  if (!trimmedKey || !sourceText.trim()) return ''

  let model = await resolveActiveModel(trimmedKey, selectedModel)
  const glossaryContext = buildGlossaryPromptContext(glossary, sourceText)

  const systemText =
    direction === 'EN_TO_KO'
      ? `당신은 제주 표선고등학교(공립 IB 월드스쿨) 공식 프로그램 평가 방문 현장의 전문 동시·순차 통역사입니다.
영어로 발화된 문장을 자연스럽고 정확한 한국어로 즉시 번역하세요.
부연 설명이나 따옴표 없이 오직 한국어 번역문만 출력하세요.
[표선고·IB 공식 용어 기준]
${glossaryContext}`
      : `You are a professional interpreter for Pyoseon High School's official IB World School Programme Evaluation Visit in Jeju, Korea.
Translate the Korean speech immediately into clear, natural, authoritative IB-register English.
Output ONLY the English translation with no commentary or quotation marks.
[Official Pyoseon High School & IB Glossary]
${glossaryContext}`

  const executeStream = async (targetModel: string): Promise<Response> => {
    return fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(targetModel)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': trimmedKey,
        },
        signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: sourceText }],
            },
          ],
        }),
      }
    )
  }

  let response = await executeStream(model)
  if (response.status === 404) {
    cachedResolvedAutoModel = null
    const { recommendedModel } = await verifyAndDiscoverModels(trimmedKey)
    model = recommendedModel
    response = await executeStream(model)
  }

  if (!response.ok || !response.body) {
    const errBody = await response.json().catch(() => null)
    throw new Error(errBody?.error?.message || `번역 요청 실패 (HTTP ${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let accumulated = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const parsed = JSON.parse(payload)
        const parts = parsed?.candidates?.[0]?.content?.parts
        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (typeof part?.text === 'string' && !part?.thought) {
              accumulated += part.text
              onChunk(accumulated.trim())
            }
          }
        }
      } catch {
        // Ignore partial SSE JSON line
      }
    }
  }

  return accumulated.trim()
}

/**
 * Generates structured AI Interpreter's Note:
 * 1) Refined direct translation
 * 2) Core logical bullet points + target-language speaking cues (so interpreter doesn't read verbatim)
 * 3) Opposite-language key vocabulary & expressions
 * 4) Numbers / figures / proper nouns check
 */
export async function generateTurnBriefing(params: {
  apiKey: string
  selectedModel: string
  direction: Direction
  sourceText: string
  glossary: GlossaryItem[]
  scopeCount?: number
}): Promise<{
  refinedTranslation: string
  briefing: InterpreterBriefing
}> {
  const { apiKey, selectedModel, direction, sourceText, glossary, scopeCount = 1 } = params
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new Error('상단 [API 설정]에서 Gemini API 키를 먼저 연동해 주세요.')
  }

  let model = await resolveActiveModel(trimmedKey, selectedModel)
  const glossaryContext = buildGlossaryPromptContext(glossary, sourceText)
  const instantHits = findInstantGlossaryMatches(sourceText, direction, glossary)

  const targetLangLabel = direction === 'EN_TO_KO' ? '한국어(Korean)' : '영어(English)'
  const sourceLangLabel = direction === 'EN_TO_KO' ? '영어(English)' : '한국어(Korean)'

  const systemPrompt = `당신은 제주 표선고등학교(공립 IB 월드스쿨)의 IB 프로그램 평가 방문 현장에서 통역사를 실시간 보조하는 '수석 통역 노트 AI'입니다.
통역사는 번역문을 그대로 보고 읽지 않고, 핵심 논리 구조와 반대 언어 핵심 어휘·표현을 눈으로 빠르게 스캔한 뒤 자신의 말로 자연스럽게 통역합니다.

현재 발화 방향: ${sourceLangLabel} 발화 → 통역사가 말해야 할 목표 언어: ${targetLangLabel}

작성 원칙:
1. refinedTranslation: 원문 전체의 자연스럽고 정확한 ${targetLangLabel} 번역문.
2. headline: 발화 핵심 의도를 한눈에 파악할 수 있는 1줄 제목 (한국어, 35자 이내).
3. intentTag: 발화 성격 태그 (예: "평가단 질의", "수업·평가 운영", "정책·지원 설명", "성찰·발전계획", "피드백·제언" 중 택1 수준으로 간결하게).
4. bulletPoints (2~4개):
   - koSummary: 발화의 핵심 논리 요점을 개조식 한국어 노트 형태로 간결히 정리 (한 항목당 45자 이내).
   - targetCue: 통역사가 입으로 바로 발화할 때 뼈대로 삼을 수 있는 핵심 ${targetLangLabel} 구문/표현 (전체 문장 낭독문이 아니라 핵심 동사구·전문 표현 중심의 간결한 말하기 단서!).
5. keyTerms (4~8개):
   - 발화에 등장한 핵심 단어·교육 전문용어·중요 동사구를 추출하여 source(${sourceLangLabel}) → target(${targetLangLabel} 반대 언어 핵심 표현)으로 매칭.
   - nuance: 유의어나 통역 시 뉘앙스 팁이 있을 때만 짧게 기재 (선택).
6. keyFigures:
   - 발화에 등장한 숫자, 연도, 시간, 횟수, 학년, 인원수, 고유명사(기관·장소·과목명)가 있다면 정확히 추출 (없으면 빈 배열 []).

[표선고·IB 월드스쿨 공식 용어집 기준]
${glossaryContext}`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      refinedTranslation: { type: 'STRING' },
      headline: { type: 'STRING' },
      intentTag: { type: 'STRING' },
      bulletPoints: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            koSummary: { type: 'STRING' },
            targetCue: { type: 'STRING' },
          },
          required: ['koSummary', 'targetCue'],
        },
      },
      keyTerms: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            source: { type: 'STRING' },
            target: { type: 'STRING' },
            nuance: { type: 'STRING' },
          },
          required: ['source', 'target'],
        },
      },
      keyFigures: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            figure: { type: 'STRING' },
            context: { type: 'STRING' },
          },
          required: ['figure', 'context'],
        },
      },
    },
    required: [
      'refinedTranslation',
      'headline',
      'intentTag',
      'bulletPoints',
      'keyTerms',
      'keyFigures',
    ],
  }

  const executeJsonCall = async (targetModel: string): Promise<Response> => {
    return fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(targetModel)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': trimmedKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: sourceText }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        }),
      }
    )
  }

  let response = await executeJsonCall(model)
  if (response.status === 404) {
    cachedResolvedAutoModel = null
    const { recommendedModel } = await verifyAndDiscoverModels(trimmedKey)
    model = recommendedModel
    response = await executeJsonCall(model)
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => null)
    throw new Error(
      errBody?.error?.message || `통역 노트 생성에 실패했습니다 (HTTP ${response.status}).`
    )
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const jsonPart = parts.find((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
  const rawText = jsonPart?.text || '{}'
  const parsed = JSON.parse(rawText)

  // Merge official glossary matches at top without duplicates
  const mergedTerms: KeyTermPair[] = [...instantHits]
  const existingTargets = new Set(instantHits.map((h) => h.target.toLowerCase()))

  if (Array.isArray(parsed.keyTerms)) {
    for (const term of parsed.keyTerms) {
      if (!term?.source || !term?.target) continue
      const normTarget = String(term.target).toLowerCase()
      if (!existingTargets.has(normTarget)) {
        existingTargets.add(normTarget)
        mergedTerms.push({
          source: String(term.source),
          target: String(term.target),
          nuance: term.nuance ? String(term.nuance) : undefined,
          fromGlossary: false,
        })
      }
    }
  }

  return {
    refinedTranslation: String(parsed.refinedTranslation || '').trim(),
    briefing: {
      headline: String(parsed.headline || '핵심 발화 요약'),
      intentTag: String(parsed.intentTag || '발화 요약'),
      bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints.slice(0, 5) : [],
      keyTerms: mergedTerms.slice(0, 10),
      keyFigures: Array.isArray(parsed.keyFigures) ? parsed.keyFigures.slice(0, 6) : [],
      generatedAt: Date.now(),
      scopeCount,
    },
  }
}

/**
 * Gemini Multimodal Audio Direct Transcription + Translation
 * Fallback/Alternative engine for iPad Safari or browsers without Web Speech API.
 */
export async function transcribeAudioChunkWithGemini(params: {
  apiKey: string
  selectedModel: string
  direction: Direction
  base64Audio: string
  mimeType: string
  glossary: GlossaryItem[]
}): Promise<{ transcript: string; translation: string }> {
  const { apiKey, selectedModel, direction, base64Audio, mimeType, glossary } = params
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) throw new Error('Gemini API 키가 필요합니다.')

  let model = await resolveActiveModel(trimmedKey, selectedModel)
  const glossaryList = glossary
    .slice(0, 25)
    .map((g) => `${g.en}${g.abbr ? ` (${g.abbr})` : ''} = ${g.ko}`)
    .join('; ')

  const prompt =
    direction === 'EN_TO_KO'
      ? `Listen to this English audio from an IB World School evaluation meeting at Pyoseon High School.
If there is no intelligible human speech (only silence or background noise), return {"transcript": "", "translation": ""}.
Otherwise, transcribe the exact English speech into "transcript" and translate it naturally into Korean in "translation".
Reference IB terms: ${glossaryList}`
      : `제주 표선고등학교 IB 월드스쿨 평가 방문 현장의 한국어 음성입니다.
의미 있는 사람 목소리가 없고 무음·소음뿐이라면 {"transcript": "", "translation": ""}을 반환하세요.
발화가 있다면 한국어 받아쓰기 원문을 "transcript"에, 자연스러운 영어 번역문을 "translation"에 작성하세요.
참고 IB 용어: ${glossaryList}`

  const executeAudioCall = async (targetModel: string) =>
    fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(targetModel)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': trimmedKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Audio,
                },
              },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              transcript: { type: 'STRING' },
              translation: { type: 'STRING' },
            },
            required: ['transcript', 'translation'],
          },
        },
      }),
    })

  let response = await executeAudioCall(model)
  if (response.status === 404) {
    cachedResolvedAutoModel = null
    const { recommendedModel } = await verifyAndDiscoverModels(trimmedKey)
    model = recommendedModel
    response = await executeAudioCall(model)
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => null)
    throw new Error(errBody?.error?.message || `음성 인식 요청 실패 (HTTP ${response.status})`)
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const jsonPart = parts.find((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
  const parsed = JSON.parse(jsonPart?.text || '{"transcript":"","translation":""}')

  return {
    transcript: String(parsed.transcript || '').trim(),
    translation: String(parsed.translation || '').trim(),
  }
}

/**
 * [중간 정리] 화자의 누적 대화를 요약하고 즉시 전달 가능한 통역 내용을 생성합니다.
 */
export async function generateCheckpointInterpretation(params: {
  apiKey: string
  selectedModel: string
  direction: Direction
  sourceTranscript: string
  turnCount: number
  glossary: GlossaryItem[]
}): Promise<CheckpointSummaryRecord> {
  const { apiKey, selectedModel, direction, sourceTranscript, turnCount, glossary } = params
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new Error('상단 [API 키 연동]에서 Gemini API 키를 먼저 저장해 주세요.')
  }

  let model = await resolveActiveModel(trimmedKey, selectedModel)
  const glossaryContext = buildGlossaryPromptContext(glossary, sourceTranscript)
  const instantHits = findInstantGlossaryMatches(sourceTranscript, direction, glossary)

  const targetLangLabel =
    direction === 'EN_TO_KO' ? '한국어(Korean)' : '영어(English)'
  const sourceLangLabel =
    direction === 'EN_TO_KO' ? '영어(English)' : '한국어(Korean)'

  const systemPrompt = `당신은 제주 표선고등학교(공립 IB 월드스쿨) 공식 프로그램 평가 방문 현장의 수석 순차 통역사입니다.
통역사가 [중간 정리] 버튼을 눌렀습니다. 지금까지 화자가 말한 ${sourceLangLabel} 발화 내용을 군더더기·반복 없이 명쾌하게 요약하고, 통역사가 청중에게 바로 전달할 수 있는 품격 있고 자연스러운 ${targetLangLabel} 요약 통역문을 제시하세요.

작성 원칙:
1. headline: 지금까지 화자가 말한 핵심 주제를 1줄로 요약 (한국어, 40자 이내).
2. speakerSummaryBullets (2~5개): 화자의 발언 요지를 논리 순서대로 간결한 한국어 개조식 문장으로 정리.
3. suggestedInterpretation:
   - 화자의 발화 핵심을 빠짐없이 담되 구어체 군더더기·중복은 정돈하여, 통역사가 현장에서 바로 전달할 수 있도록 자연스럽고 정중한 ${targetLangLabel} 구어 통역문으로 작성하세요.
   - ${
     direction === 'EN_TO_KO'
       ? '표선고 교직원·학생들이 즉시 이해할 수 있도록 명확하고 자연스러운 한국어 경어체(~했습니다, ~하시겠습니까 등)로 작성하세요.'
       : 'IB 방문 평가단(Visiting Team)에게 전달하기에 적합한 명확하고 품격 있는 국제 교육 현장 영어(clear, natural professional English)로 작성하세요.'
   }
4. keyTerms (4~8개): 핵심 용어 및 표현을 source(${sourceLangLabel}) → target(${targetLangLabel}) 쌍으로 정리.
5. keyFigures: 발화 중 언급된 수치, 연도, 인원, 횟수, 고유명사 체크리스트 (없으면 []).

[표선고·IB 월드스쿨 공식 용어집 기준]
${glossaryContext}`

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      headline: { type: 'STRING' },
      speakerSummaryBullets: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      suggestedInterpretation: { type: 'STRING' },
      keyTerms: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            source: { type: 'STRING' },
            target: { type: 'STRING' },
            nuance: { type: 'STRING' },
          },
          required: ['source', 'target'],
        },
      },
      keyFigures: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            figure: { type: 'STRING' },
            context: { type: 'STRING' },
          },
          required: ['figure', 'context'],
        },
      },
    },
    required: [
      'headline',
      'speakerSummaryBullets',
      'suggestedInterpretation',
      'keyTerms',
      'keyFigures',
    ],
  }

  const executeCall = async (targetModel: string): Promise<Response> =>
    fetch(`${GEMINI_API_BASE}/models/${encodeURIComponent(targetModel)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': trimmedKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: sourceTranscript }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      }),
    })

  let response = await executeCall(model)
  if (response.status === 404) {
    cachedResolvedAutoModel = null
    const { recommendedModel } = await verifyAndDiscoverModels(trimmedKey)
    model = recommendedModel
    response = await executeCall(model)
  }

  if (!response.ok) {
    const errBody = await response.json().catch(() => null)
    throw new Error(
      errBody?.error?.message || `중간 정리 생성에 실패했습니다 (HTTP ${response.status}).`
    )
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const jsonPart = parts.find((p: { text?: string; thought?: boolean }) => p.text && !p.thought)
  const parsed = JSON.parse(jsonPart?.text || '{}')

  const mergedTerms: KeyTermPair[] = [...instantHits]
  const existingTargets = new Set(instantHits.map((h) => h.target.toLowerCase()))

  if (Array.isArray(parsed.keyTerms)) {
    for (const term of parsed.keyTerms) {
      if (!term?.source || !term?.target) continue
      const normTarget = String(term.target).toLowerCase()
      if (!existingTargets.has(normTarget)) {
        existingTargets.add(normTarget)
        mergedTerms.push({
          source: String(term.source),
          target: String(term.target),
          nuance: term.nuance ? String(term.nuance) : undefined,
          fromGlossary: false,
        })
      }
    }
  }

  return {
    id: `ckpt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    direction,
    headline: String(parsed.headline || '대화 중간 정리'),
    speakerSummaryBullets: Array.isArray(parsed.speakerSummaryBullets)
      ? parsed.speakerSummaryBullets.map((s: unknown) => String(s)).slice(0, 6)
      : [],
    suggestedInterpretation: String(parsed.suggestedInterpretation || '').trim(),
    keyTerms: mergedTerms.slice(0, 10),
    keyFigures: Array.isArray(parsed.keyFigures) ? parsed.keyFigures.slice(0, 6) : [],
    sourceTranscript,
    turnCount,
  }
}
