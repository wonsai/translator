import {
  Download,
  FileText,
  FolderOpen,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { CheckpointSummaryRecord } from '../types'
import {
  downloadAllCheckpointsTxtFile,
  downloadCheckpointTxtFile,
  parseCheckpointsFromTxt,
} from '../utils/checkpointTxt'

interface CheckpointArchiveDrawerProps {
  isOpen: boolean
  records: CheckpointSummaryRecord[]
  activeCheckpointId: string | null
  onClose: () => void
  onSelectCheckpoint: (record: CheckpointSummaryRecord) => void
  onImportCheckpoints: (imported: CheckpointSummaryRecord[]) => void
  onDeleteCheckpoint: (id: string) => void
  onClearAllCheckpoints: () => void
}

export function CheckpointArchiveDrawer({
  isOpen,
  records,
  activeCheckpointId,
  onClose,
  onSelectCheckpoint,
  onImportCheckpoints,
  onDeleteCheckpoint,
  onClearAllCheckpoints,
}: CheckpointArchiveDrawerProps) {
  const [query, setQuery] = useState('')
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase()
    const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt)
    if (!q) return sorted
    return sorted.filter(
      (r) =>
        r.headline.toLowerCase().includes(q) ||
        r.suggestedInterpretation.toLowerCase().includes(q) ||
        r.sourceTranscript.toLowerCase().includes(q) ||
        r.speakerSummaryBullets.some((b) => b.toLowerCase().includes(q))
    )
  }, [query, records])

  if (!isOpen) return null

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const allImported: CheckpointSummaryRecord[] = []

    for (const file of Array.from(fileList)) {
      const text = await file.text()
      const parsed = parseCheckpointsFromTxt(text, file.name)
      allImported.push(...parsed)
    }

    if (allImported.length > 0) {
      onImportCheckpoints(allImported)
      setImportNotice(
        `PC에서 ${allImported.length}개의 중간 정리 기록을 성공적으로 불러와 화면에 표시했습니다.`
      )
    } else {
      setImportNotice('선택한 파일에서 불러올 텍스트 내용을 찾지 못했습니다.')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    void processFiles(e.dataTransfer.files)
  }

  return (
    <div
      className="drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="중간 정리 보관함 및 PC txt 파일 불러오기"
    >
      <aside
        className="drawer-sheet"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDraggingOver(true)
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
      >
        <div className="drawer-top">
          <div className="modal-header" style={{ marginBottom: 12 }}>
            <div>
              <h2>중간 정리 보관함 & 내 PC .txt 불러오기</h2>
              <p>
                [중간 정리]를 누를 때마다 이곳에 자동 저장되며 내 PC에 .txt 파일로 내려받아집니다.
                이전에 저장한 .txt 파일을 선택하거나 끌어다 놓으면 언제든 다시 불러올 수 있습니다.
              </p>
            </div>
            <button type="button" className="mini-btn" onClick={onClose} aria-label="보관함 닫기">
              <X size={16} />
            </button>
          </div>

          {/* PC File Import & Bulk Export Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: isDraggingOver ? 'var(--ochre-surface)' : 'var(--bg-recessed)',
              border: '1px dashed var(--line-strong)',
              marginBottom: 10,
            }}
          >
            <input
              ref={fileInputRef}
              id="input-import-txt"
              type="file"
              accept=".txt,text/plain"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => void processFiles(e.target.files)}
            />
            <button
              id="btn-import-txt-pc"
              type="button"
              className="primary-btn"
              style={{ flex: 1 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
              <span>내 PC에서 .txt 파일 불러오기</span>
            </button>

            <button
              id="btn-download-all-txt"
              type="button"
              className="secondary-btn"
              disabled={records.length === 0}
              onClick={() => downloadAllCheckpointsTxtFile(records)}
              title="보관함에 있는 모든 중간 정리 내용을 하나의 txt 파일로 통합 저장합니다"
            >
              <Download size={15} />
              <span>전체 통합 .txt 저장</span>
            </button>
          </div>

          {importNotice && (
            <div className="status-banner ok" style={{ marginBottom: 10 }}>
              {importNotice}
            </div>
          )}

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
              id="input-checkpoint-search"
              type="text"
              className="text-input"
              style={{ paddingLeft: 34 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="저장된 중간 정리 검색 (주제, 통역문, 키워드...)"
            />
          </div>
        </div>

        <div className="glossary-list">
          {records.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--ink-tertiary)', fontWeight: 600 }}>
                자동 저장 기록 총 {records.length}건 (최신순)
              </span>
              <button type="button" className="mini-btn" onClick={onClearAllCheckpoints}>
                <Trash2 size={12} /> 전체 비우기
              </button>
            </div>
          )}

          {filteredRecords.map((rec) => {
            const isSelected = rec.id === activeCheckpointId
            const isEn = rec.direction === 'EN_TO_KO'
            const dt = new Date(rec.createdAt).toLocaleString('ko-KR', {
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            return (
              <div
                key={rec.id}
                className="glossary-row"
                style={{
                  flexDirection: 'column',
                  gap: 8,
                  boxShadow: isSelected ? '0 0 0 2px var(--ink-primary)' : undefined,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onSelectCheckpoint(rec)
                  onClose()
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className={`direction-pill ${isEn ? 'en' : 'ko'}`}>
                      {isEn ? '영 → 한 통역' : '한 → 영 통역'}
                    </span>
                    <span className="utterance-time">{dt}</span>
                    {rec.importedFileName && (
                      <span className="intent-tag">불러온 파일: {rec.importedFileName}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => downloadCheckpointTxtFile(rec)}
                      title="내 PC에 .txt 파일로 다시 다운로드"
                    >
                      <Download size={12} />
                      <span>.txt</span>
                    </button>
                    <button
                      type="button"
                      className="mini-btn"
                      onClick={() => onDeleteCheckpoint(rec.id)}
                      title="기록 삭제"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%' }}>
                  <div className="glossary-en" style={{ fontSize: '0.92rem' }}>
                    {rec.headline}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--ink-secondary)',
                      marginTop: 4,
                      lineHeight: 1.48,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {rec.suggestedInterpretation}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--en-ink)',
                    }}
                  >
                    <FolderOpen size={13} /> 클릭하여 통역 화면에 불러오기
                  </span>
                </div>
              </div>
            )
          })}

          {filteredRecords.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                color: 'var(--ink-tertiary)',
                fontSize: '0.86rem',
                lineHeight: 1.6,
              }}
            >
              <FileText size={26} style={{ marginBottom: 8, opacity: 0.55 }} />
              <div>아직 저장된 중간 정리 기록이 없습니다.</div>
              <div>
                상단 <strong>[중간 정리]</strong> 버튼을 누르면 요약·통역문이 자동 저장되며, 위{' '}
                <strong>[내 PC에서 .txt 파일 불러오기]</strong>로 기존 파일도 열 수 있습니다.
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
