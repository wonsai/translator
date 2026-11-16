import {
  BookOpen,
  CheckCircle2,
  CornerDownLeft,
  KeyRound,
  Mic,
  MicOff,
  Moon,
  Sun,
} from 'lucide-react'
import type { Direction, FontScaleLevel } from '../types'

interface HeaderBarProps {
  direction: Direction
  isListening: boolean
  canFinalizeTurn: boolean
  hasApiKey: boolean
  glossaryCount: number
  theme: 'light' | 'dark'
  fontScale: FontScaleLevel
  onSwitchDirection: (dir: Direction) => void
  onToggleListening: () => void
  onFinalizeTurn: () => void
  onChangeFontScale: (scale: FontScaleLevel) => void
  onToggleTheme: () => void
  onOpenGlossary: () => void
  onOpenSettings: () => void
}

const SCALE_OPTIONS: Array<{ value: FontScaleLevel; label: string }> = [
  { value: 'compact', label: '작게' },
  { value: 'normal', label: '표준' },
  { value: 'large', label: '크게' },
  { value: 'xlarge', label: '특대' },
]

export function HeaderBar({
  direction,
  isListening,
  canFinalizeTurn,
  hasApiKey,
  glossaryCount,
  theme,
  fontScale,
  onSwitchDirection,
  onToggleListening,
  onFinalizeTurn,
  onChangeFontScale,
  onToggleTheme,
  onOpenGlossary,
  onOpenSettings,
}: HeaderBarProps) {
  return (
    <header className="desk-header" id="app-top-header">
      <div className="brand-group">
        <div className="brand-mark" aria-hidden="true">
          IB
        </div>
        <div className="brand-titles">
          <h1>표선고 IB 평가방문 통역 데스크</h1>
          <div className="brand-subtitle">
            <span>Pyoseon High School · IB Evaluation Visit</span>
          </div>
        </div>
      </div>

      {/* Central Live Direction & Mic Console */}
      <div className="live-console" role="group" aria-label="실시간 통역 방향 및 마이크 제어">
        <button
          id="btn-dir-en-ko"
          type="button"
          className={`direction-btn ${direction === 'EN_TO_KO' ? 'active-en' : ''}`}
          onClick={() => onSwitchDirection('EN_TO_KO')}
          title="영어 발화를 듣고 한국어로 번역·요약합니다 (단축키 Alt+1)"
        >
          <span>영 → 한 듣기</span>
          <span className="dir-shortcut">Alt+1</span>
        </button>

        <button
          id="btn-dir-ko-en"
          type="button"
          className={`direction-btn ${direction === 'KO_TO_EN' ? 'active-ko' : ''}`}
          onClick={() => onSwitchDirection('KO_TO_EN')}
          title="한국어 발화를 듣고 영어로 번역·요약합니다 (단축키 Alt+2)"
        >
          <span>한 → 영 듣기</span>
          <span className="dir-shortcut">Alt+2</span>
        </button>

        <div className="console-divider" aria-hidden="true" />

        <button
          id="btn-mic-toggle"
          type="button"
          className={`mic-trigger-btn ${isListening ? 'is-listening' : ''}`}
          onClick={onToggleListening}
          title="실시간 음성 받아쓰기 시작/일시정지 (단축키 Space)"
        >
          <span className="rec-dot" aria-hidden="true" />
          {isListening ? (
            <>
              <MicOff size={15} />
              <span>듣기 중지</span>
            </>
          ) : (
            <>
              <Mic size={15} />
              <span>실시간 듣기 시작</span>
            </>
          )}
        </button>

        <button
          id="btn-finalize-turn"
          type="button"
          className="turn-cut-btn"
          disabled={!canFinalizeTurn}
          onClick={onFinalizeTurn}
          title="현재 발화 구간을 끊고 AI 핵심 요약을 즉시 정리합니다 (단축키 Enter)"
        >
          <CornerDownLeft size={14} />
          <span>구간 완료</span>
        </button>
      </div>

      {/* Right Desk Utilities */}
      <div className="utility-group">
        <div className="scale-segmented" role="group" aria-label="글자 크기 조절">
          {SCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              id={`btn-scale-${opt.value}`}
              type="button"
              className={`scale-btn ${fontScale === opt.value ? 'active' : ''}`}
              onClick={() => onChangeFontScale(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          id="btn-theme-toggle"
          type="button"
          className="util-btn"
          onClick={onToggleTheme}
          title={theme === 'light' ? '회의실 저눈부심 어두운 화면으로 전환' : '종이 밝은 화면으로 전환'}
          aria-label="화면 테마 전환"
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button
          id="btn-open-glossary"
          type="button"
          className="util-btn"
          onClick={onOpenGlossary}
        >
          <BookOpen size={15} />
          <span>IB 용어집 ({glossaryCount})</span>
        </button>

        <button
          id="btn-open-settings"
          type="button"
          className={`util-btn ${hasApiKey ? 'api-ready' : 'api-missing'}`}
          onClick={onOpenSettings}
        >
          {hasApiKey ? <CheckCircle2 size={15} /> : <KeyRound size={15} />}
          <span>{hasApiKey ? 'API 연결됨' : 'API 키 연동'}</span>
        </button>
      </div>
    </header>
  )
}
