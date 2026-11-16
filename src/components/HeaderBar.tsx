import {
  BookOpen,
  CheckCircle2,
  FileCheck2,
  FolderOpen,
  KeyRound,
  Loader2,
  Mic,
  MicOff,
  Moon,
  Sun,
} from 'lucide-react'
import type { Direction, FontScaleLevel } from '../types'

interface HeaderBarProps {
  direction: Direction
  isListening: boolean
  hasAnyTurns: boolean
  isGeneratingCheckpoint: boolean
  checkpointCount: number
  hasApiKey: boolean
  glossaryCount: number
  theme: 'light' | 'dark'
  fontScale: FontScaleLevel
  onSwitchDirection: (dir: Direction) => void
  onToggleListening: () => void
  onTriggerCheckpoint: () => void
  onChangeFontScale: (scale: FontScaleLevel) => void
  onToggleTheme: () => void
  onOpenCheckpoints: () => void
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
  hasAnyTurns,
  isGeneratingCheckpoint,
  checkpointCount,
  hasApiKey,
  glossaryCount,
  theme,
  fontScale,
  onSwitchDirection,
  onToggleListening,
  onTriggerCheckpoint,
  onChangeFontScale,
  onToggleTheme,
  onOpenCheckpoints,
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

      {/* Central Live Direction, Mic & 중간 정리 Console */}
      <div className="live-console" role="group" aria-label="실시간 통역 방향, 마이크 및 중간 정리 제어">
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
              <span>실시간 듣기</span>
            </>
          )}
        </button>

        <button
          id="btn-mid-summary"
          type="button"
          className="checkpoint-trigger-btn"
          disabled={!hasAnyTurns || isGeneratingCheckpoint}
          onClick={onTriggerCheckpoint}
          title="지금까지 화자가 말한 대화를 요약해 통역 내용을 제시하고 자동저장 및 PC txt 파일로 저장합니다 (단축키 Alt+S)"
        >
          {isGeneratingCheckpoint ? (
            <>
              <Loader2 size={15} className="spin-icon" />
              <span>중간 정리 중...</span>
            </>
          ) : (
            <>
              <FileCheck2 size={15} />
              <span>중간 정리</span>
              <span className="dir-shortcut">Alt+S</span>
            </>
          )}
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
          id="btn-open-checkpoints"
          type="button"
          className="util-btn"
          onClick={onOpenCheckpoints}
          title="자동 저장된 중간 정리 기록을 보거나 PC의 txt 파일을 불러옵니다"
        >
          <FolderOpen size={15} />
          <span>기록 불러오기 ({checkpointCount})</span>
        </button>

        <button
          id="btn-open-glossary"
          type="button"
          className="util-btn"
          onClick={onOpenGlossary}
        >
          <BookOpen size={15} />
          <span>IB 용어 ({glossaryCount})</span>
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
