import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CheckpointArchiveDrawer } from './components/CheckpointArchiveDrawer'
import { GlossaryDrawer } from './components/GlossaryDrawer'
import { HeaderBar } from './components/HeaderBar'
import {
  InterpreterBriefingPanel,
  type RightPanelMode,
} from './components/InterpreterBriefingPanel'
import { SettingsModal } from './components/SettingsModal'
import { TranscriptStream } from './components/TranscriptStream'
import {
  DEFAULT_IB_GLOSSARY,
  SAMPLE_EVALUATION_SCENARIOS,
  type SampleScenario,
} from './data/ibGlossary'
import { useSpeechInterpreter } from './hooks/useSpeechInterpreter'
import { FALLBACK_MODEL_OPTIONS } from './services/geminiService'
import type {
  AppSettings,
  CheckpointSummaryRecord,
  Direction,
  FontScaleLevel,
  GeminiModelOption,
  GlossaryItem,
  KeyTermPair,
} from './types'
import { downloadCheckpointTxtFile } from './utils/checkpointTxt'

const SETTINGS_STORAGE_KEY = 'pyoseon_ib_interpreter_settings_v1'
const SESSION_API_KEY = 'pyoseon_ib_interpreter_session_key_v1'
const CUSTOM_GLOSSARY_KEY = 'pyoseon_ib_custom_glossary_v1'
const PINNED_TERMS_KEY = 'pyoseon_ib_pinned_terms_v1'
const CHECKPOINTS_STORAGE_KEY = 'pyoseon_ib_checkpoints_v1'

function loadInitialSettings(): AppSettings {
  const urlTheme =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('theme')
      : null
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    const sessionKey = sessionStorage.getItem(SESSION_API_KEY) || ''
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>
      const persistence = parsed.persistence === 'session' ? 'session' : 'local'
      return {
        apiKey: persistence === 'session' ? sessionKey : parsed.apiKey || '',
        persistence,
        selectedModel: parsed.selectedModel || 'auto',
        audioEngine: parsed.audioEngine === 'gemini_audio' ? 'gemini_audio' : 'web_speech',
        theme: urlTheme === 'dark' ? 'dark' : parsed.theme === 'dark' ? 'dark' : 'light',
        fontScale: parsed.fontScale || 'normal',
        enableInterimTranslation: parsed.enableInterimTranslation ?? true,
        autoDownloadCheckpointTxt: parsed.autoDownloadCheckpointTxt ?? true,
      }
    }
  } catch {
    // ignore storage read issues
  }
  return {
    apiKey: '',
    persistence: 'local',
    selectedModel: 'auto',
    audioEngine: 'web_speech',
    theme: urlTheme === 'dark' ? 'dark' : 'light',
    fontScale: 'normal',
    enableInterimTranslation: true,
    autoDownloadCheckpointTxt: true,
  }
}

function loadCustomGlossary(): GlossaryItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_GLOSSARY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

function loadPinnedTerms(): KeyTermPair[] {
  try {
    const raw = localStorage.getItem(PINNED_TERMS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return [
    {
      source: 'Programme Standards and Practices (PSP)',
      target: '프로그램 기준과 실천',
      fromGlossary: true,
    },
    {
      source: '내부 채점 기준화 협의',
      target: 'Internal Standardization',
      fromGlossary: true,
    },
  ]
}

function loadSavedCheckpoints(): CheckpointSummaryRecord[] {
  try {
    const raw = localStorage.getItem(CHECKPOINTS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // ignore
  }
  return []
}

export function App() {
  const [settings, setSettings] = useState<AppSettings>(loadInitialSettings)
  const [discoveredModels, setDiscoveredModels] =
    useState<GeminiModelOption[]>(FALLBACK_MODEL_OPTIONS)
  const [customGlossary, setCustomGlossary] = useState<GlossaryItem[]>(loadCustomGlossary)
  const [pinnedTerms, setPinnedTerms] = useState<KeyTermPair[]>(loadPinnedTerms)
  const [savedCheckpoints, setSavedCheckpoints] =
    useState<CheckpointSummaryRecord[]>(loadSavedCheckpoints)
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(
    () => loadSavedCheckpoints()[0]?.id ?? null
  )
  const [rightPanelMode, setRightPanelMode] = useState<RightPanelMode>('single')
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const [isCheckpointDrawerOpen, setIsCheckpointDrawerOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'transcript' | 'briefing'>('transcript')
  const didAutoDemoRef = useRef(false)

  const fullGlossary = useMemo(
    () => [...customGlossary, ...DEFAULT_IB_GLOSSARY],
    [customGlossary]
  )

  const handleCheckpointReady = useCallback(
    (record: CheckpointSummaryRecord) => {
      setSavedCheckpoints((prev) => {
        const next = [record, ...prev.filter((item) => item.id !== record.id)]
        try {
          localStorage.setItem(CHECKPOINTS_STORAGE_KEY, JSON.stringify(next))
        } catch {
          // ignore storage quota errors
        }
        return next
      })
      setActiveCheckpointId(record.id)
      setRightPanelMode('checkpoint')
      setMobilePane('briefing')

      if (settings.autoDownloadCheckpointTxt) {
        const fileName = downloadCheckpointTxtFile(record)
        setSaveNotice(
          `중간 정리 완료! 브라우저에 자동 저장되었으며 내 PC에 "${fileName}" 파일로 저장되었습니다.`
        )
      } else {
        setSaveNotice(
          '중간 정리 완료! 브라우저 보관함에 자동 저장되었습니다. ([.txt 저장] 버튼으로 PC에 내려받을 수 있습니다.)'
        )
      }
    },
    [settings.autoDownloadCheckpointTxt]
  )

  const {
    direction,
    isListening,
    audioLevel,
    micError,
    setMicError,
    turns,
    selectedTurnId,
    setSelectedTurnId,
    contextBriefing,
    setContextBriefing,
    isGeneratingContextBriefing,
    isGeneratingCheckpoint,
    toggleListening,
    switchDirection,
    finalizeCurrentTurn,
    createSpeakerCheckpoint,
    submitManualOrSampleUtterance,
    runBriefingForTurn,
    summarizeRecentContext,
    clearAllTurns,
  } = useSpeechInterpreter({
    apiKey: settings.apiKey,
    selectedModel: settings.selectedModel,
    audioEngine: settings.audioEngine,
    enableInterimTranslation: settings.enableInterimTranslation,
    glossary: fullGlossary,
    onCheckpointReady: handleCheckpointReady,
  })

  useEffect(() => {
    if (didAutoDemoRef.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === '1') {
      didAutoDemoRef.current = true
      const enSample = SAMPLE_EVALUATION_SCENARIOS[0]
      const koSample = SAMPLE_EVALUATION_SCENARIOS[1]
      void submitManualOrSampleUtterance(enSample.text, enSample.direction, enSample)
      void submitManualOrSampleUtterance(koSample.text, koSample.direction, koSample)
    }
  }, [submitManualOrSampleUtterance])

  const activeTurn = useMemo(() => {
    if (!turns.length) return null
    if (selectedTurnId) {
      const found = turns.find((t) => t.id === selectedTurnId)
      if (found) return found
    }
    return turns[turns.length - 1]
  }, [selectedTurnId, turns])

  const activeCheckpoint = useMemo(() => {
    if (!savedCheckpoints.length) return null
    if (activeCheckpointId) {
      const found = savedCheckpoints.find((c) => c.id === activeCheckpointId)
      if (found) return found
    }
    return savedCheckpoints[0]
  }, [activeCheckpointId, savedCheckpoints])

  const canFinalizeTurn = useMemo(
    () => turns.some((t) => t.isInterim),
    [turns]
  )

  const persistSettings = useCallback(
    (next: AppSettings, models?: GeminiModelOption[]) => {
      setSettings(next)
      if (models?.length) {
        setDiscoveredModels(models)
      }
      try {
        if (next.persistence === 'session') {
          sessionStorage.setItem(SESSION_API_KEY, next.apiKey)
          localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify({ ...next, apiKey: '' })
          )
        } else {
          sessionStorage.removeItem(SESSION_API_KEY)
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
        }
      } catch {
        // ignore storage quota errors
      }
    },
    []
  )

  const handleToggleTheme = () => {
    persistSettings({
      ...settings,
      theme: settings.theme === 'light' ? 'dark' : 'light',
    })
  }

  const handleChangeFontScale = (fontScale: FontScaleLevel) => {
    persistSettings({ ...settings, fontScale })
  }

  const handleAddCustomGlossary = (en: string, ko: string, abbr?: string) => {
    const newItem: GlossaryItem = {
      id: `custom-${Date.now()}`,
      en,
      ko,
      abbr,
      category: 'custom',
      isCustom: true,
    }
    const next = [newItem, ...customGlossary]
    setCustomGlossary(next)
    localStorage.setItem(CUSTOM_GLOSSARY_KEY, JSON.stringify(next))
  }

  const handleRemoveCustomGlossary = (id: string) => {
    const next = customGlossary.filter((item) => item.id !== id)
    setCustomGlossary(next)
    localStorage.setItem(CUSTOM_GLOSSARY_KEY, JSON.stringify(next))
  }

  const handleResetCustomGlossary = () => {
    setCustomGlossary([])
    localStorage.removeItem(CUSTOM_GLOSSARY_KEY)
  }

  const handleTogglePinTerm = (term: KeyTermPair) => {
    setPinnedTerms((prev) => {
      const exists = prev.some(
        (p) =>
          p.target.toLowerCase() === term.target.toLowerCase() &&
          p.source.toLowerCase() === term.source.toLowerCase()
      )
      const next = exists
        ? prev.filter(
            (p) =>
              !(
                p.target.toLowerCase() === term.target.toLowerCase() &&
                p.source.toLowerCase() === term.source.toLowerCase()
              )
          )
        : [term, ...prev]
      localStorage.setItem(PINNED_TERMS_KEY, JSON.stringify(next))
      return next
    })
  }

  const handleTogglePinFromGlossary = (item: GlossaryItem) => {
    const enLabel = item.abbr ? `${item.en} (${item.abbr})` : item.en
    const pair: KeyTermPair =
      direction === 'EN_TO_KO'
        ? { source: enLabel, target: item.ko, fromGlossary: true }
        : { source: item.ko, target: enLabel, fromGlossary: true }
    handleTogglePinTerm(pair)
  }

  const handleClearPinnedTerms = () => {
    setPinnedTerms([])
    localStorage.setItem(PINNED_TERMS_KEY, JSON.stringify([]))
  }

  const handleManualOrSampleSubmit = useCallback(
    (text: string, dirOverride?: Direction, sample?: SampleScenario) => {
      setRightPanelMode('single')
      setSaveNotice(null)
      void submitManualOrSampleUtterance(text, dirOverride, sample)
    },
    [submitManualOrSampleUtterance]
  )

  const handleSelectCheckpoint = (record: CheckpointSummaryRecord) => {
    setActiveCheckpointId(record.id)
    setRightPanelMode('checkpoint')
    setMobilePane('briefing')
    setSaveNotice(
      record.importedFileName
        ? `PC에서 불러온 기록(${record.importedFileName})을 통역 화면에 열었습니다.`
        : '저장된 중간 정리 기록을 통역 화면에 불러왔습니다.'
    )
  }

  const handleImportCheckpoints = (imported: CheckpointSummaryRecord[]) => {
    if (!imported.length) return
    setSavedCheckpoints((prev) => {
      const importedById = new Map(imported.map((item) => [item.id, item]))
      const remaining = prev.filter((item) => !importedById.has(item.id))
      const merged = [...imported, ...remaining]
      try {
        localStorage.setItem(CHECKPOINTS_STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // ignore quota errors
      }
      return merged
    })
    setActiveCheckpointId(imported[0].id)
    setRightPanelMode('checkpoint')
    setMobilePane('briefing')
    setSaveNotice(
      `내 PC에서 ${imported.length}개의 .txt 기록을 불러와 자동 저장하고 화면에 표시했습니다.`
    )
  }

  const handleDeleteCheckpoint = (id: string) => {
    setSavedCheckpoints((prev) => {
      const next = prev.filter((item) => item.id !== id)
      try {
        localStorage.setItem(CHECKPOINTS_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    if (activeCheckpointId === id) {
      setActiveCheckpointId(null)
    }
  }

  const handleClearAllCheckpoints = () => {
    setSavedCheckpoints([])
    setActiveCheckpointId(null)
    localStorage.removeItem(CHECKPOINTS_STORAGE_KEY)
    setRightPanelMode('single')
  }

  // Ergonomic Interpreter Keyboard Shortcuts (supports both EN and KO IME layouts via e.code)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen || isGlossaryOpen || isCheckpointDrawerOpen) return
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTypingField =
        tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable

      if (e.altKey && (e.code === 'Digit1' || e.key === '1')) {
        e.preventDefault()
        switchDirection('EN_TO_KO')
        return
      }
      if (e.altKey && (e.code === 'Digit2' || e.key === '2')) {
        e.preventDefault()
        switchDirection('KO_TO_EN')
        return
      }
      if (e.altKey && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
        e.preventDefault()
        if (turns.length > 0 && !isGeneratingCheckpoint) {
          void createSpeakerCheckpoint()
        }
        return
      }

      if (isTypingField) return

      if (e.code === 'Space') {
        e.preventDefault()
        toggleListening()
      } else if (e.key === 'Enter' && canFinalizeTurn) {
        e.preventDefault()
        finalizeCurrentTurn()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    canFinalizeTurn,
    createSpeakerCheckpoint,
    finalizeCurrentTurn,
    isCheckpointDrawerOpen,
    isGeneratingCheckpoint,
    isGlossaryOpen,
    isSettingsOpen,
    switchDirection,
    toggleListening,
    turns.length,
  ])

  return (
    <div
      className="app-shell"
      data-theme={settings.theme}
      data-scale={settings.fontScale}
    >
      <HeaderBar
        direction={direction}
        isListening={isListening}
        hasAnyTurns={turns.length > 0}
        isGeneratingCheckpoint={isGeneratingCheckpoint}
        checkpointCount={savedCheckpoints.length}
        hasApiKey={Boolean(settings.apiKey.trim())}
        glossaryCount={fullGlossary.length}
        theme={settings.theme}
        fontScale={settings.fontScale}
        onSwitchDirection={switchDirection}
        onToggleListening={toggleListening}
        onTriggerCheckpoint={() => void createSpeakerCheckpoint()}
        onChangeFontScale={handleChangeFontScale}
        onToggleTheme={handleToggleTheme}
        onOpenCheckpoints={() => setIsCheckpointDrawerOpen(true)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Portrait Tablet / Mobile Quick Tab Switcher */}
      <div className="mobile-pane-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'transcript'}
          className={`mobile-pane-tab ${mobilePane === 'transcript' ? 'active' : ''}`}
          onClick={() => setMobilePane('transcript')}
        >
          받아쓰기 & 직독번역 ({turns.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === 'briefing'}
          className={`mobile-pane-tab ${mobilePane === 'briefing' ? 'active' : ''}`}
          onClick={() => setMobilePane('briefing')}
        >
          중간 정리 & 통역 브리핑
        </button>
      </div>

      <main className="workspace-grid">
        <TranscriptStream
          direction={direction}
          isListening={isListening}
          audioLevel={audioLevel}
          audioEngine={settings.audioEngine}
          micError={micError}
          turns={turns}
          selectedTurnId={activeTurn?.id || null}
          hasApiKey={Boolean(settings.apiKey.trim())}
          mobileHidden={mobilePane !== 'transcript'}
          onSelectTurn={(id) => {
            setSelectedTurnId(id)
            setContextBriefing(null)
            setRightPanelMode('single')
          }}
          onManualSubmit={handleManualOrSampleSubmit}
          onRetryBriefing={(turn) =>
            void runBriefingForTurn(turn.id, turn.sourceText, turn.direction)
          }
          onClearAll={clearAllTurns}
          onDismissError={() => setMicError(null)}
        />

        <InterpreterBriefingPanel
          panelMode={rightPanelMode}
          activeTurn={activeTurn}
          activeCheckpoint={activeCheckpoint}
          turnsCount={turns.length}
          contextBriefing={contextBriefing}
          isGeneratingContextBriefing={isGeneratingContextBriefing}
          isGeneratingCheckpoint={isGeneratingCheckpoint}
          pinnedTerms={pinnedTerms}
          hasApiKey={Boolean(settings.apiKey.trim())}
          saveNotice={saveNotice}
          mobileHidden={mobilePane !== 'briefing'}
          onChangePanelMode={setRightPanelMode}
          onTogglePinTerm={handleTogglePinTerm}
          onClearPinnedTerms={handleClearPinnedTerms}
          onSummarizeRecentContext={() => void summarizeRecentContext()}
          onOpenArchive={() => setIsCheckpointDrawerOpen(true)}
          onDismissSaveNotice={() => setSaveNotice(null)}
        />
      </main>

      <CheckpointArchiveDrawer
        isOpen={isCheckpointDrawerOpen}
        records={savedCheckpoints}
        activeCheckpointId={activeCheckpoint?.id || null}
        onClose={() => setIsCheckpointDrawerOpen(false)}
        onSelectCheckpoint={handleSelectCheckpoint}
        onImportCheckpoints={handleImportCheckpoints}
        onDeleteCheckpoint={handleDeleteCheckpoint}
        onClearAllCheckpoints={handleClearAllCheckpoints}
      />

      <GlossaryDrawer
        isOpen={isGlossaryOpen}
        glossary={fullGlossary}
        pinnedTerms={pinnedTerms}
        onClose={() => setIsGlossaryOpen(false)}
        onAddCustomItem={handleAddCustomGlossary}
        onRemoveCustomItem={handleRemoveCustomGlossary}
        onResetCustomItems={handleResetCustomGlossary}
        onTogglePinFromGlossary={handleTogglePinFromGlossary}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        discoveredModels={discoveredModels}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(next, models) => {
          persistSettings(next, models)
        }}
      />
    </div>
  )
}

export default App
