export type Direction = 'EN_TO_KO' | 'KO_TO_EN'

export type AudioEngineMode = 'web_speech' | 'gemini_audio'

export type StoragePersistence = 'local' | 'session'

export type FontScaleLevel = 'compact' | 'normal' | 'large' | 'xlarge'

export type GlossaryCategory =
  | 'evaluation'
  | 'curriculum'
  | 'assessment'
  | 'pyoseon'
  | 'custom'

export interface GlossaryItem {
  id: string
  en: string
  ko: string
  abbr?: string
  category: GlossaryCategory
  note?: string
  isCustom?: boolean
}

export interface KeyTermPair {
  source: string
  target: string
  nuance?: string
  fromGlossary?: boolean
}

export interface KeyFigureItem {
  figure: string
  context: string
}

export interface BulletPointNote {
  koSummary: string
  targetCue: string
}

export interface InterpreterBriefing {
  headline: string
  intentTag: string
  bulletPoints: BulletPointNote[]
  keyTerms: KeyTermPair[]
  keyFigures: KeyFigureItem[]
  generatedAt: number
  scopeCount: number
}

export interface UtteranceTurn {
  id: string
  direction: Direction
  createdAt: number
  sourceText: string
  translatedText: string
  isInterim?: boolean
  isTranslating?: boolean
  isSummarizing?: boolean
  instantGlossaryHits: KeyTermPair[]
  briefing?: InterpreterBriefing
  error?: string
}

export interface GeminiModelOption {
  id: string
  displayName: string
  description?: string
}

export interface AppSettings {
  apiKey: string
  persistence: StoragePersistence
  selectedModel: string
  audioEngine: AudioEngineMode
  theme: 'light' | 'dark'
  fontScale: FontScaleLevel
  enableInterimTranslation: boolean
}
