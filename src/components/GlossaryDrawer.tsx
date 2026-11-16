import { Pin, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GLOSSARY_CATEGORY_LABELS } from '../data/ibGlossary'
import type { GlossaryCategory, GlossaryItem, KeyTermPair } from '../types'

interface GlossaryDrawerProps {
  isOpen: boolean
  glossary: GlossaryItem[]
  pinnedTerms: KeyTermPair[]
  onClose: () => void
  onAddCustomItem: (en: string, ko: string, abbr?: string) => void
  onRemoveCustomItem: (id: string) => void
  onResetCustomItems: () => void
  onTogglePinFromGlossary: (item: GlossaryItem) => void
}

export function GlossaryDrawer({
  isOpen,
  glossary,
  pinnedTerms,
  onClose,
  onAddCustomItem,
  onRemoveCustomItem,
  onResetCustomItems,
  onTogglePinFromGlossary,
}: GlossaryDrawerProps) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | GlossaryCategory>('all')
  const [newEn, setNewEn] = useState('')
  const [newKo, setNewKo] = useState('')

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return glossary.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false
      if (!q) return true
      return (
        item.en.toLowerCase().includes(q) ||
        item.ko.toLowerCase().includes(q) ||
        (item.abbr && item.abbr.toLowerCase().includes(q)) ||
        (item.note && item.note.toLowerCase().includes(q))
      )
    })
  }, [activeCategory, glossary, query])

  if (!isOpen) return null

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEn.trim() || !newKo.trim()) return
    onAddCustomItem(newEn.trim(), newKo.trim())
    setNewEn('')
    setNewKo('')
  }

  const customCount = glossary.filter((g) => g.isCustom).length

  const isGlossaryPinned = (item: GlossaryItem) => {
    const enLabel = item.abbr ? `${item.en} (${item.abbr})` : item.en
    return pinnedTerms.some(
      (p) =>
        (p.source === enLabel && p.target === item.ko) ||
        (p.source === item.ko && p.target === enLabel)
    )
  }

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="표선고 IB 평가방문 용어집">
      <aside className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-top">
          <div className="modal-header" style={{ marginBottom: 12 }}>
            <div>
              <h2>표선고 · IB 월드스쿨 평가 방문 용어집</h2>
              <p>
                등록된 용어는 발화 즉시(0초) 자동 감지되며 Gemini 통역 프롬프트에 자동 반영됩니다.
                핀 아이콘을 누르면 메인 화면 상단에 상시 고정할 수 있습니다.
              </p>
            </div>
            <button type="button" className="mini-btn" onClick={onClose} aria-label="용어집 닫기">
              <X size={16} />
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-tertiary)',
              }}
            />
            <input
              id="input-glossary-search"
              type="text"
              className="text-input"
              style={{ paddingLeft: 34 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="용어 검색 (예: PSP, 내부평가, 기준화, 동행관, TOK...)"
            />
          </div>

          <div className="category-pills">
            <button
              type="button"
              className={`cat-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              전체 ({glossary.length})
            </button>
            {(Object.keys(GLOSSARY_CATEGORY_LABELS) as GlossaryCategory[]).map((cat) => {
              const count = glossary.filter((g) => g.category === cat).length
              return (
                <button
                  key={cat}
                  type="button"
                  className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {GLOSSARY_CATEGORY_LABELS[cat]} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Glossary Quick Add Form */}
        <form className="glossary-add-box" onSubmit={handleAdd}>
          <input
            id="input-custom-en"
            type="text"
            className="text-input"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            placeholder="영문 표현 (예: Action Plan)"
          />
          <input
            id="input-custom-ko"
            type="text"
            className="text-input"
            value={newKo}
            onChange={(e) => setNewKo(e.target.value)}
            placeholder="국문 표현 (예: 실행 계획서)"
          />
          <button
            id="btn-add-glossary"
            type="submit"
            className="primary-btn"
            disabled={!newEn.trim() || !newKo.trim()}
          >
            <Plus size={15} />
            <span>용어 추가</span>
          </button>
        </form>

        <div className="glossary-list">
          {customCount > 0 && activeCategory === 'custom' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              <button type="button" className="mini-btn" onClick={onResetCustomItems}>
                <RotateCcw size={12} /> 사용자 추가 용어 전체 초기화
              </button>
            </div>
          )}

          {filteredItems.map((item) => {
            const pinned = isGlossaryPinned(item)
            return (
              <div key={item.id} className="glossary-row">
                <div>
                  <div className="glossary-en">
                    {item.en} {item.abbr ? `(${item.abbr})` : ''}
                  </div>
                  <div className="glossary-ko">{item.ko}</div>
                  {item.note && <div className="glossary-note">{item.note}</div>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    className={`pin-icon-btn ${pinned ? 'pinned' : ''}`}
                    onClick={() => onTogglePinFromGlossary(item)}
                    title={pinned ? '메인 화면 상단 고정 해제' : '메인 화면 상단에 고정해 두기'}
                  >
                    <Pin size={14} />
                  </button>
                  {item.isCustom && (
                    <button
                      type="button"
                      className="pin-icon-btn"
                      onClick={() => onRemoveCustomItem(item.id)}
                      title="삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--ink-tertiary)', fontSize: '0.86rem' }}>
              일치하는 용어가 없습니다. 위 입력창에서 직접 맞춤 용어를 추가해 보세요.
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
