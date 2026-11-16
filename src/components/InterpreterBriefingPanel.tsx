import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileCheck2,
  FolderOpen,
  Hash,
  Layers,
  ListChecks,
  MessageSquareQuote,
  Pin,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type {
  CheckpointSummaryRecord,
  Direction,
  InterpreterBriefing,
  KeyTermPair,
  UtteranceTurn,
} from '../types'
import { downloadCheckpointTxtFile, formatCheckpointToTxt } from '../utils/checkpointTxt'

export type RightPanelMode = 'checkpoint' | 'single' | 'context'

interface InterpreterBriefingPanelProps {
  panelMode: RightPanelMode
  activeTurn: UtteranceTurn | null
  activeCheckpoint: CheckpointSummaryRecord | null
  turnsCount: number
  contextBriefing: InterpreterBriefing | null
  isGeneratingContextBriefing: boolean
  isGeneratingCheckpoint: boolean
  pinnedTerms: KeyTermPair[]
  hasApiKey: boolean
  saveNotice: string | null
  mobileHidden?: boolean
  onChangePanelMode: (mode: RightPanelMode) => void
  onTogglePinTerm: (term: KeyTermPair) => void
  onClearPinnedTerms: () => void
  onSummarizeRecentContext: () => void
  onOpenArchive: () => void
  onDismissSaveNotice: () => void
}

export function InterpreterBriefingPanel({
  panelMode,
  activeTurn,
  activeCheckpoint,
  turnsCount,
  contextBriefing,
  isGeneratingContextBriefing,
  isGeneratingCheckpoint,
  pinnedTerms,
  hasApiKey,
  saveNotice,
  mobileHidden,
  onChangePanelMode,
  onTogglePinTerm,
  onClearPinnedTerms,
  onSummarizeRecentContext,
  onOpenArchive,
  onDismissSaveNotice,
}: InterpreterBriefingPanelProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)
  const [showRawCheckpointSource, setShowRawCheckpointSource] = useState(false)

  const effectiveMode: RightPanelMode =
    panelMode === 'checkpoint' && activeCheckpoint
      ? 'checkpoint'
      : panelMode === 'context' && contextBriefing
        ? 'context'
        : 'single'

  const briefing = effectiveMode === 'context' ? contextBriefing : activeTurn?.briefing || null

  const activeDirection: Direction =
    effectiveMode === 'checkpoint' && activeCheckpoint
      ? activeCheckpoint.direction
      : activeTurn?.direction || 'EN_TO_KO'

  const displayTerms: KeyTermPair[] =
    effectiveMode === 'checkpoint' && activeCheckpoint
      ? activeCheckpoint.keyTerms
      : briefing?.keyTerms?.length
        ? briefing.keyTerms
        : activeTurn?.instantGlossaryHits || []

  const isPinned = (term: KeyTermPair) =>
    pinnedTerms.some(
      (p) =>
        p.target.toLowerCase() === term.target.toLowerCase() &&
        p.source.toLowerCase() === term.source.toLowerCase()
    )

  const handleCopyTerm = (term: KeyTermPair) => {
    void navigator.clipboard.writeText(term.target)
    setCopiedKey(term.target)
    window.setTimeout(() => setCopiedKey(null), 1300)
  }

  const handleCopyCheckpointAll = (ckpt: CheckpointSummaryRecord) => {
    void navigator.clipboard.writeText(formatCheckpointToTxt(ckpt))
    setCopiedScript(true)
    window.setTimeout(() => setCopiedScript(false), 1600)
  }

  return (
    <section
      className={`desk-pane ${mobileHidden ? 'mobile-hidden' : ''}`}
      id="pane-interpreter-briefing"
      aria-label="통역사 핵심 요약 및 중간 정리 통역문"
    >
      <div className="pane-header">
        <div className="pane-title-group">
          <h2>통역 핵심 브리핑 & 중간 정리 통역문</h2>
          <span className="pane-caption">
            [중간 정리] 실행 시 대화 요약·통역 제시문 표시 및 PC .txt 자동 저장
          </span>
        </div>

        <div className="pane-actions">
          <button
            id="btn-briefing-checkpoint"
            type="button"
            className={`mini-btn ${effectiveMode === 'checkpoint' ? 'active' : ''}`}
            disabled={!activeCheckpoint}
            onClick={() => onChangePanelMode('checkpoint')}
            title="가장 최근에 생성하거나 불러온 중간 정리 통역문을 봅니다"
          >
            <FileCheck2 size={12} />
            <span>중간 정리</span>
          </button>

          <button
            id="btn-briefing-single"
            type="button"
            className={`mini-btn ${effectiveMode === 'single' ? 'active' : ''}`}
            onClick={() => onChangePanelMode('single')}
          >
            <span>선택 발화</span>
          </button>

          <button
            id="btn-briefing-context"
            type="button"
            className={`mini-btn ${effectiveMode === 'context' ? 'active' : ''}`}
            disabled={turnsCount < 2 || !hasApiKey || isGeneratingContextBriefing}
            onClick={() => {
              onChangePanelMode('context')
              onSummarizeRecentContext()
            }}
            title="최근 3개 발화를 하나의 흐름으로 묶어 요약합니다"
          >
            <Layers size={12} />
            <span>{isGeneratingContextBriefing ? '종합 중...' : '최근 흐름'}</span>
          </button>
        </div>
      </div>

      <div className="briefing-scroll">
        {saveNotice && (
          <div
            className="status-banner ok"
            style={{
              marginBottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span>{saveNotice}</span>
            <button
              type="button"
              onClick={onDismissSaveNotice}
              style={{ fontWeight: 700, flexShrink: 0 }}
              aria-label="알림 닫기"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Pinned Quick-Glance Vocabulary Board */}
        {pinnedTerms.length > 0 && (
          <div className="pinned-strip" aria-label="고정해둔 핵심 통역 단어">
            <div className="pinned-strip-header">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Bookmark size={13} /> 상단 고정 핵심 표현 ({pinnedTerms.length})
              </span>
              <button
                type="button"
                onClick={onClearPinnedTerms}
                style={{ fontSize: '0.73rem', fontWeight: 700, opacity: 0.8 }}
              >
                전체 해제
              </button>
            </div>
            <div className="pinned-chips">
              {pinnedTerms.map((item) => (
                <span key={`${item.source}-${item.target}`} className="pinned-chip">
                  <strong>{item.target}</strong>
                  <span>({item.source})</span>
                  <button
                    type="button"
                    onClick={() => onTogglePinTerm(item)}
                    aria-label="고정 해제"
                    style={{ display: 'grid', placeItems: 'center', opacity: 0.65 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {isGeneratingCheckpoint && (
          <div className="briefing-section" style={{ borderStyle: 'dashed' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <Sparkles size={16} />
              <span>화자의 누적 대화를 요약하고 실전 통역 전달문을 정리하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* ====================================================================
            MODE A: 중간 정리 (Speaker Dialogue Summary + Suggested Interpretation)
            ==================================================================== */}
        {effectiveMode === 'checkpoint' && activeCheckpoint ? (
          <>
            <div className="briefing-section checkpoint-highlight-card">
              <div className="section-eyebrow">
                <span className="eyebrow-label">
                  <FileCheck2 size={14} />
                  중간 정리 ·{' '}
                  {activeCheckpoint.direction === 'EN_TO_KO'
                    ? '영어 발화 요약 & 한국어 통역 제시문'
                    : '한국어 발화 요약 & 영어 통역 제시문'}
                </span>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => downloadCheckpointTxtFile(activeCheckpoint)}
                    title="내 PC에 .txt 파일로 저장"
                  >
                    <Download size={12} />
                    <span>.txt 저장</span>
                  </button>
                  <button
                    type="button"
                    className="mini-btn"
                    onClick={() => handleCopyCheckpointAll(activeCheckpoint)}
                  >
                    {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedScript ? '복사됨' : '전체 복사'}</span>
                  </button>
                  <button type="button" className="mini-btn" onClick={onOpenArchive}>
                    <FolderOpen size={12} />
                    <span>보관함</span>
                  </button>
                </div>
              </div>

              <h3 className="briefing-headline">{activeCheckpoint.headline}</h3>

              {/* 1) 화자 대화 핵심 요약 */}
              <div style={{ marginBottom: 14 }}>
                <div className="sub-eyebrow">1. 화자 대화 핵심 요약</div>
                <ol className="bullet-notes-list">
                  {activeCheckpoint.speakerSummaryBullets.map((line, i) => (
                    <li key={i} className="bullet-note-item">
                      <span className="bullet-num">{i + 1}</span>
                      <div className="bullet-body">
                        <div className="bullet-ko">{line}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 2) 제시된 통역 내용 (Suggested Interpretation Delivery) */}
              <div
                className={`suggested-script-card ${
                  activeCheckpoint.direction === 'EN_TO_KO' ? 'dir-en' : 'dir-ko'
                }`}
              >
                <div className="suggested-script-header">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquareQuote size={15} />
                    {activeCheckpoint.direction === 'EN_TO_KO'
                      ? '2. 제시된 한국어 통역 내용 (전달문)'
                      : '2. Suggested English Interpretation (통역 전달문)'}
                  </span>
                </div>
                <div className="suggested-script-body">
                  {activeCheckpoint.suggestedInterpretation}
                </div>
              </div>

              {activeCheckpoint.keyFigures.length > 0 && (
                <div className="figures-row" aria-label="놓치면 안 되는 수치 및 고유명사">
                  {activeCheckpoint.keyFigures.map((fig, idx) => (
                    <div key={idx} className="figure-chip">
                      <Hash size={12} style={{ alignSelf: 'center', opacity: 0.6 }} />
                      <strong>{fig.figure}</strong>
                      <span>{fig.context}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Expandable Raw Source Transcript */}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="mini-btn"
                  onClick={() => setShowRawCheckpointSource((v) => !v)}
                >
                  {showRawCheckpointSource ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  <span>
                    {showRawCheckpointSource ? '원문 발화 접기' : '요약된 원문 발화 확인하기'}
                  </span>
                </button>
                {showRawCheckpointSource && (
                  <pre className="raw-source-preview">{activeCheckpoint.sourceTranscript}</pre>
                )}
              </div>
            </div>

            {/* Key Vocabulary Section for Checkpoint */}
            {displayTerms.length > 0 && (
              <div className="briefing-section">
                <div className="section-eyebrow">
                  <span className="eyebrow-label">
                    <Sparkles size={14} />
                    {activeDirection === 'EN_TO_KO'
                      ? '반대 언어 핵심 단어 (English → 한국어 통역어)'
                      : '반대 언어 핵심 단어 (한국어 → English 통역어)'}
                  </span>
                </div>
                <div className="vocab-grid">
                  {displayTerms.map((term, idx) => {
                    const pinned = isPinned(term)
                    return (
                      <div
                        key={`${term.source}-${term.target}-${idx}`}
                        className={`vocab-card ${
                          activeDirection === 'EN_TO_KO' ? 'dir-en' : 'dir-ko'
                        } ${term.fromGlossary ? 'glossary-verified' : ''}`}
                      >
                        <div>
                          <div className="vocab-top">
                            <div
                              className="vocab-target"
                              onClick={() => handleCopyTerm(term)}
                              style={{ cursor: 'pointer' }}
                            >
                              {term.fromGlossary && <span className="ib-tag">IB 공식</span>}
                              {term.target}
                            </div>
                            <div style={{ display: 'flex', gap: 2 }}>
                              <button
                                type="button"
                                className="pin-icon-btn"
                                onClick={() => handleCopyTerm(term)}
                              >
                                {copiedKey === term.target ? (
                                  <Check size={13} />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                              <button
                                type="button"
                                className={`pin-icon-btn ${pinned ? 'pinned' : ''}`}
                                onClick={() => onTogglePinTerm(term)}
                              >
                                <Pin size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="vocab-source">원문: {term.source}</div>
                        </div>
                        {term.nuance && <div className="vocab-nuance">{term.nuance}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : !activeTurn && !briefing ? (
          <div className="empty-desk-state">
            <div className="empty-desk-icon">
              <ListChecks size={22} />
            </div>
            <h3>중간 정리 통역문 & 반대 언어 어휘 보드</h3>
            <p>
              화자가 말하는 동안 실시간 요약과 어휘가 표시되며, 상단{' '}
              <strong>[중간 정리]</strong> 버튼을 누르면 그 사람의 대화를 깔끔하게 요약한{' '}
              <strong>실전 통역 전달문</strong>이 제시됨과 동시에 자동 저장 및 내 PC{' '}
              <code>.txt</code> 파일 다운로드가 실행됩니다. 이전에 저장한 파일은 우측 상단{' '}
              <strong>[기록 불러오기]</strong>에서 언제든 다시 열 수 있습니다.
            </p>
          </div>
        ) : (
          /* ====================================================================
             MODE B: Single Utterance / Rolling Context Live Note
             ==================================================================== */
          <>
            <div className="briefing-section">
              <div className="section-eyebrow">
                <span className="eyebrow-label">
                  <ListChecks size={14} />
                  {effectiveMode === 'context'
                    ? `최근 ${briefing?.scopeCount || 3}개 발화 통합 요지`
                    : activeDirection === 'EN_TO_KO'
                      ? '한국어 통역 핵심 구조 (Core Points)'
                      : '영어 통역 핵심 구조 (Core Points & English Cues)'}
                </span>

                {activeTurn?.isSummarizing ? (
                  <span
                    className="intent-tag"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <Sparkles size={12} /> AI 핵심 정리 중...
                  </span>
                ) : briefing?.intentTag ? (
                  <span className="intent-tag">{briefing.intentTag}</span>
                ) : null}
              </div>

              {briefing ? (
                <>
                  <h3 className="briefing-headline">{briefing.headline}</h3>

                  <ol className="bullet-notes-list">
                    {briefing.bulletPoints.map((pt, index) => (
                      <li key={index} className="bullet-note-item">
                        <span className="bullet-num">{index + 1}</span>
                        <div className="bullet-body">
                          <div className="bullet-ko">{pt.koSummary}</div>
                          {pt.targetCue && (
                            <div className="bullet-cue">
                              {activeDirection === 'KO_TO_EN' ? 'EN 발화 뼈대: ' : '통역 포인트: '}
                              {pt.targetCue}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>

                  {briefing.keyFigures.length > 0 && (
                    <div className="figures-row" aria-label="놓치면 안 되는 수치 및 고유명사">
                      {briefing.keyFigures.map((fig, idx) => (
                        <div key={idx} className="figure-chip">
                          <Hash size={12} style={{ alignSelf: 'center', opacity: 0.6 }} />
                          <strong>{fig.figure}</strong>
                          <span>{fig.context}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', lineHeight: 1.6 }}
                >
                  {activeTurn?.isSummarizing ? (
                    '발화 내용을 통역사 노트로 구조화하고 있습니다...'
                  ) : hasApiKey ? (
                    '문장이 마무리되거나 상단 [중간 정리] 버튼을 누르면 즉시 요약과 통역 내용이 제시됩니다.'
                  ) : (
                    '우측 상단 [API 키 연동]에서 Gemini API 키를 저장하면 실시간 AI 핵심 요약이 활성화됩니다.'
                  )}
                </div>
              )}
            </div>

            <div className="briefing-section">
              <div className="section-eyebrow">
                <span className="eyebrow-label">
                  <Sparkles size={14} />
                  {activeDirection === 'EN_TO_KO'
                    ? '반대 언어 핵심 단어 (English → 한국어 통역어)'
                    : '반대 언어 핵심 단어 (한국어 → English 통역어)'}
                </span>
                <span style={{ fontSize: '0.73rem', color: 'var(--ink-tertiary)' }}>
                  핀 고정 가능 · 클릭 시 복사
                </span>
              </div>

              {displayTerms.length > 0 ? (
                <div className="vocab-grid">
                  {displayTerms.map((term, idx) => {
                    const pinned = isPinned(term)
                    return (
                      <div
                        key={`${term.source}-${term.target}-${idx}`}
                        className={`vocab-card ${
                          activeDirection === 'EN_TO_KO' ? 'dir-en' : 'dir-ko'
                        } ${term.fromGlossary ? 'glossary-verified' : ''}`}
                      >
                        <div>
                          <div className="vocab-top">
                            <div
                              className="vocab-target"
                              onClick={() => handleCopyTerm(term)}
                              style={{ cursor: 'pointer' }}
                              title="클릭하여 반대 언어 표현 복사"
                            >
                              {term.fromGlossary && <span className="ib-tag">IB 공식</span>}
                              {term.target}
                            </div>

                            <div style={{ display: 'flex', gap: 2 }}>
                              <button
                                type="button"
                                className="pin-icon-btn"
                                onClick={() => handleCopyTerm(term)}
                                title="표현 복사"
                              >
                                {copiedKey === term.target ? (
                                  <Check size={13} />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                              <button
                                type="button"
                                className={`pin-icon-btn ${pinned ? 'pinned' : ''}`}
                                onClick={() => onTogglePinTerm(term)}
                                title={pinned ? '상단 고정 해제' : '회의 내내 볼 수 있게 상단에 고정'}
                              >
                                <Pin size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="vocab-source">원문: {term.source}</div>
                        </div>

                        {term.nuance && <div className="vocab-nuance">{term.nuance}</div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  style={{ fontSize: '0.85rem', color: 'var(--ink-tertiary)', lineHeight: 1.55 }}
                >
                  발화 속 IB 교육과정 용어는 즉시(0초) 매칭되며, 문맥상 핵심 동사·명사 표현은 AI가
                  반대 언어로 추출해 표시합니다.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
