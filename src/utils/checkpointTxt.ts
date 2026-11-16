import type {
  CheckpointSummaryRecord,
  Direction,
  KeyFigureItem,
  KeyTermPair,
} from '../types'

const HEADER_DIVIDER = '============================================================'

function formatTimestampForFilename(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

function formatReadableDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Formats a CheckpointSummaryRecord into clean, human-readable Korean plain text
 * that opens cleanly in Windows Notepad / macOS TextEdit AND can be re-imported later.
 */
export function formatCheckpointToTxt(record: CheckpointSummaryRecord): string {
  const dirText =
    record.direction === 'EN_TO_KO'
      ? '영 → 한 (평가단 영어 발화 → 한국어 통역)'
      : '한 → 영 (학교측 한국어 발화 → 영어 통역)'

  const summaryLines =
    record.speakerSummaryBullets.length > 0
      ? record.speakerSummaryBullets.map((line, i) => `${i + 1}) ${line}`).join('\n')
      : '- (요약 항목 없음)'

  const termLines: string[] = []
  for (const t of record.keyTerms) {
    termLines.push(
      `- ${t.source} → ${t.target}${t.nuance ? ` (${t.nuance})` : ''}`
    )
  }
  for (const f of record.keyFigures) {
    termLines.push(`- [수치/고유명사] ${f.figure}: ${f.context}`)
  }

  return [
    HEADER_DIVIDER,
    '표선고등학교 IB 평가 방문 — 통역 중간 정리 기록',
    HEADER_DIVIDER,
    `[기록 ID] ${record.id}`,
    `[일시] ${formatReadableDateTime(record.createdAt)}`,
    `[통역 방향] ${dirText}`,
    `[주제 한줄 요약] ${record.headline}`,
    '',
    '[1. 화자 대화 핵심 요약]',
    summaryLines,
    '',
    '[2. 제시된 통역 내용 (전달문)]',
    record.suggestedInterpretation || '(통역 제시문 없음)',
    '',
    '[3. 핵심 단어 및 수치 체크]',
    termLines.length > 0 ? termLines.join('\n') : '- (추출된 핵심 단어 없음)',
    '',
    '[4. 받아쓰기 원문 기록]',
    record.sourceTranscript || '(원문 없음)',
    HEADER_DIVIDER,
    '',
  ].join('\n')
}

/**
 * Downloads a single CheckpointSummaryRecord to the user's PC as a UTF-8 .txt file (with BOM for Windows Notepad).
 */
export function downloadCheckpointTxtFile(record: CheckpointSummaryRecord): string {
  const txtBody = formatCheckpointToTxt(record)
  const dirShort = record.direction === 'EN_TO_KO' ? '영한' : '한영'
  const fileName = `표선고_통역중간정리_${dirShort}_${formatTimestampForFilename(
    record.createdAt
  )}.txt`

  triggerTextFileDownload(fileName, txtBody)
  return fileName
}

/**
 * Downloads all saved CheckpointSummaryRecords combined into one consolidated .txt file.
 */
export function downloadAllCheckpointsTxtFile(records: CheckpointSummaryRecord[]): void {
  if (!records.length) return
  const ordered = [...records].sort((a, b) => a.createdAt - b.createdAt)
  const combined = ordered.map((r) => formatCheckpointToTxt(r)).join('\n')
  const fileName = `표선고_통역중간정리_전체통합본_${formatTimestampForFilename(
    Date.now()
  )}.txt`
  triggerTextFileDownload(fileName, combined)
}

function triggerTextFileDownload(fileName: string, content: string): void {
  // Include UTF-8 BOM (\uFEFF) so Windows Notepad opens Korean characters cleanly
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Parses a .txt file (either a single checkpoint or a consolidated multi-checkpoint .txt file,
 * or even a free-form plain text note) back into CheckpointSummaryRecord objects!
 */
export function parseCheckpointsFromTxt(
  rawFileText: string,
  fileName: string
): CheckpointSummaryRecord[] {
  const cleaned = rawFileText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
  if (!cleaned) return []

  // Split if file contains multiple consolidated checkpoint blocks
  const marker = '표선고등학교 IB 평가 방문 — 통역 중간 정리 기록'
  if (cleaned.includes(marker)) {
    const rawBlocks = cleaned
      .split(marker)
      .map((b) => b.trim())
      .filter((b) => b.includes('[1. 화자 대화 핵심 요약]') || b.includes('[2. 제시된 통역 내용'))

    if (rawBlocks.length > 0) {
      return rawBlocks.map((block, index) => parseStructuredBlock(block, fileName, index))
    }
  }

  // Fallback for arbitrary plain-text .txt files loaded by the user
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean)
  const firstLine = lines[0]?.slice(0, 48) || fileName.replace(/\.txt$/i, '')
  const hasHangulFirst = /[가-힣]/.test(cleaned.slice(0, 120))

  return [
    {
      id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
      direction: hasHangulFirst ? 'KO_TO_EN' : 'EN_TO_KO',
      headline: firstLine,
      speakerSummaryBullets: lines.slice(0, 4),
      suggestedInterpretation: cleaned,
      keyTerms: [],
      keyFigures: [],
      sourceTranscript: cleaned,
      turnCount: 1,
      importedFileName: fileName,
    },
  ]
}

function parseStructuredBlock(
  block: string,
  fileName: string,
  idx: number
): CheckpointSummaryRecord {
  const cleanBlock = block.replace(/^=+$/gm, '').trim()

  const idMatch = cleanBlock.match(/\[기록 ID\]\s*(.+)/)
  const dateMatch = cleanBlock.match(/\[일시\]\s*(.+)/)
  const dirMatch = cleanBlock.match(/\[통역 방향\]\s*(.+)/)
  const headMatch = cleanBlock.match(/\[주제 한줄 요약\]\s*(.+)/)

  const parsedTime = dateMatch?.[1] ? Date.parse(dateMatch[1].trim().replace(' ', 'T')) : NaN
  const createdAt = Number.isNaN(parsedTime) ? Date.now() + idx : parsedTime

  const direction: Direction =
    dirMatch?.[1] && dirMatch[1].includes('한 → 영') ? 'KO_TO_EN' : 'EN_TO_KO'

  const sec1 = extractSection(
    cleanBlock,
    '[1. 화자 대화 핵심 요약]',
    '[2. 제시된 통역 내용 (전달문)]'
  )
  const sec2 = extractSection(
    cleanBlock,
    '[2. 제시된 통역 내용 (전달문)]',
    '[3. 핵심 단어 및 수치 체크]'
  )
  const sec3 = extractSection(
    cleanBlock,
    '[3. 핵심 단어 및 수치 체크]',
    '[4. 받아쓰기 원문 기록]'
  )
  const sec4 = extractSection(cleanBlock, '[4. 받아쓰기 원문 기록]', null)

  const speakerSummaryBullets = sec1
    .split('\n')
    .map((l) => l.replace(/^\d+\)\s*|^-\s*/, '').trim())
    .filter((l) => l && l !== '(요약 항목 없음)')

  const keyTerms: KeyTermPair[] = []
  const keyFigures: KeyFigureItem[] = []

  for (const rawLine of sec3.split('\n')) {
    const line = rawLine.replace(/^-\s*/, '').trim()
    if (!line || line === '(추출된 핵심 단어 없음)') continue

    if (line.startsWith('[수치/고유명사]')) {
      const rest = line.replace('[수치/고유명사]', '').trim()
      const colonIdx = rest.indexOf(':')
      if (colonIdx > 0) {
        keyFigures.push({
          figure: rest.slice(0, colonIdx).trim(),
          context: rest.slice(colonIdx + 1).trim(),
        })
      }
    } else if (line.includes('→')) {
      const [left, rightRaw] = line.split('→').map((s) => s.trim())
      if (left && rightRaw) {
        const nuanceMatch = rightRaw.match(/^(.*?)\s*\(([^)]+)\)$/)
        keyTerms.push({
          source: left,
          target: nuanceMatch ? nuanceMatch[1].trim() : rightRaw,
          nuance: nuanceMatch ? nuanceMatch[2].trim() : undefined,
        })
      }
    }
  }

  return {
    id:
      idMatch?.[1]?.trim() ||
      `imported-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt,
    direction,
    headline: headMatch?.[1]?.trim() || fileName.replace(/\.txt$/i, ''),
    speakerSummaryBullets,
    suggestedInterpretation:
      sec2 === '(통역 제시문 없음)' ? '' : sec2,
    keyTerms,
    keyFigures,
    sourceTranscript: sec4 === '(원문 없음)' ? '' : sec4,
    turnCount: 1,
    importedFileName: fileName,
  }
}

function extractSection(text: string, startHeader: string, endHeader: string | null): string {
  const startIdx = text.indexOf(startHeader)
  if (startIdx === -1) return ''
  const contentStart = startIdx + startHeader.length
  if (!endHeader) {
    return text.slice(contentStart).trim()
  }
  const endIdx = text.indexOf(endHeader, contentStart)
  if (endIdx === -1) {
    return text.slice(contentStart).trim()
  }
  return text.slice(contentStart, endIdx).trim()
}
