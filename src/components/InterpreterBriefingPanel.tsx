import {
  Bookmark,
  Check,
  Copy,
  Hash,
  Layers,
  ListChecks,
  Pin,
  Sparkles,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { Direction, InterpreterBriefing, KeyTermPair, UtteranceTurn } from '../types'

interface InterpreterBriefingPanelProps {
  activeTurn: UtteranceTurn | null
  turnsCount: number
  contextBriefing: InterpreterBriefing | null
  isGeneratingContextBriefing: boolean
  pinnedTerms: KeyTermPair[]
  hasApiKey: boolean
  mobileHidden?: boolean
  onTogglePinTerm: (term: KeyTermPair) => void
  onClearPinnedTerms: () => void
  onSummarizeRecentContext: () => void
  onSwitchToSingleTurnMode: () => void
}

export function InterpreterBriefingPanel({
  activeTurn,
  turnsCount,
  contextBriefing,
  isGeneratingContextBriefing,
  pinnedTerms,
  hasApiKey,
  mobileHidden,
  onTogglePinTerm,
  onClearPinnedTerms,
  onSummarizeRecentContext,
  onSwitchToSingleTurnMode,
}: InterpreterBriefingPanelProps) {
  const [viewMode, setViewMode] = useState<'single' | 'context'>('single')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const effectiveMode = viewMode === 'context' && contextBriefing ? 'context' : 'single'
  const briefing = effectiveMode === 'context' ? contextBriefing : activeTurn?.briefing || null
  const activeDirection: Direction = activeTurn?.direction || 'EN_TO_KO'

  // Combine AI keyTerms with instant 0ms glossary matches while AI is still generating
  const displayTerms: KeyTermPair[] = briefing?.keyTerms?.length
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

  return (
    <section
      className={`desk-pane ${mobileHidden ? 'mobile-hidden' : ''}`}
      id="pane-interpreter-briefing"
      aria-label="통역사 핵심 요약 및 반대 언어 단어장"
    >
      <div className="pane-header">
        <div className="pane-title-group">
          <h2>통역 핵심 브리핑 & 반대 언어 단어장</h2>
          <span className="pane-caption">그대로 읽지 않고 내 말로 통역하기 위한 요약 노트</span>
        </div>

        <div className="pane-actions">
          <button
            id="btn-briefing-single"
            type="button"
            className={`mini-btn ${effectiveMode === 'single' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('single')
              onSwitchToSingleTurnMode()
            }}
          >
            <span>선택 발화</span>
          </button>
          <button
            id="btn-briefing-context"
            type="button"
            className={`mini-btn ${effectiveMode === 'context' ? 'active' : ''}`}
            disabled={turnsCount < 2 || !hasApiKey || isGeneratingContextBriefing}
            onClick={() => {
              setViewMode('context')
              onSummarizeRecentContext()
            }}
            title="최근 3개 발화를 하나의 흐름으로 묶어 요약합니다"
          >
            <Layers size={12} />
            <span>{isGeneratingContextBriefing ? '종합 중...' : '최근 흐름 종합'}</span>
          </button>
        </div>
      </div>

      <div className="briefing-scroll">
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

        {!activeTurn && !briefing ? (
          <div className="empty-desk-state">
            <div className="empty-desk-icon">
              <ListChecks size={22} />
            </div>
            <h3>핵심 논지 구조화 & 반대 언어 어휘 카드</h3>
            <p>
              발화가 시작되면 <strong>① 말해야 할 핵심 논지 요약</strong>,{' '}
              <strong>② 입으로 바로 꺼내 쓸 반대 언어 표현 단서</strong>,{' '}
              <strong>③ 핵심 단어(원어 ↔ 반대 언어) 및 수치 체크</strong>가 이곳에 정리됩니다.
              좌측 상단의 <strong>리허설 샘플</strong> 버튼을 눌러 실제 화면 구성을 바로 확인해 보세요.
            </p>
          </div>
        ) : (
          <>
            {/* Section 1: Structured Core Points for Speaking */}
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
                  <span className="intent-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
                <div style={{ fontSize: '0.88rem', color: 'var(--ink-secondary)', lineHeight: 1.6 }}>
                  {activeTurn?.isSummarizing ? (
                    '발화 내용을 통역사 노트로 구조화하고 있습니다...'
                  ) : hasApiKey ? (
                    '문장이 마무리되거나 상단 [구간 완료] 버튼을 누르면 즉시 핵심 요점이 정리됩니다.'
                  ) : (
                    '우측 상단 [API 키 연동]에서 Gemini API 키를 저장하면 실시간 AI 핵심 요약이 활성화됩니다.'
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Opposite-Language Key Vocabulary & IB Terms */}
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
                        className={`vocab-card ${activeDirection === 'EN_TO_KO' ? 'dir-en' : 'dir-ko'} ${
                          term.fromGlossary ? 'glossary-verified' : ''
                        }`}
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
                                {copiedKey === term.target ? <Check size={13} /> : <Copy size={13} />}
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
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-tertiary)', lineHeight: 1.55 }}>
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
