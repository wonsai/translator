import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { isWebSpeechSupported } from '../hooks/useSpeechInterpreter'
import { FALLBACK_MODEL_OPTIONS, verifyAndDiscoverModels } from '../services/geminiService'
import type {
  AppSettings,
  AudioEngineMode,
  GeminiModelOption,
  StoragePersistence,
} from '../types'

interface SettingsModalProps {
  isOpen: boolean
  settings: AppSettings
  discoveredModels: GeminiModelOption[]
  onClose: () => void
  onSaveSettings: (next: AppSettings, models?: GeminiModelOption[]) => void
}

export function SettingsModal({
  isOpen,
  settings,
  discoveredModels,
  onClose,
  onSaveSettings,
}: SettingsModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [persistence, setPersistence] = useState<StoragePersistence>(settings.persistence)
  const [selectedModel, setSelectedModel] = useState(settings.selectedModel)
  const [audioEngine, setAudioEngine] = useState<AudioEngineMode>(settings.audioEngine)
  const [enableInterimTranslation, setEnableInterimTranslation] = useState(
    settings.enableInterimTranslation
  )

  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<{
    type: 'ok' | 'warn'
    text: string
  } | null>(null)
  const [localModels, setLocalModels] = useState<GeminiModelOption[]>(
    discoveredModels.length ? discoveredModels : FALLBACK_MODEL_OPTIONS
  )

  if (!isOpen) return null

  const webSpeechAvailable = isWebSpeechSupported()

  const handleVerifyAndSave = async () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed) {
      onSaveSettings({
        ...settings,
        apiKey: '',
        persistence,
        selectedModel,
        audioEngine,
        enableInterimTranslation,
      })
      setVerifyMessage({ type: 'warn', text: 'API 키가 비워진 상태로 저장되었습니다.' })
      return
    }

    setIsVerifying(true)
    setVerifyMessage(null)
    try {
      const { models, recommendedModel } = await verifyAndDiscoverModels(trimmed)
      setLocalModels(models)
      const nextModel =
        selectedModel === 'auto' || models.some((m) => m.id === selectedModel)
          ? selectedModel
          : 'auto'
      setSelectedModel(nextModel)

      onSaveSettings(
        {
          ...settings,
          apiKey: trimmed,
          persistence,
          selectedModel: nextModel,
          audioEngine,
          enableInterimTranslation,
        },
        models
      )

      setVerifyMessage({
        type: 'ok',
        text: `연결 확인 완료! 최적 실시간 모델(${recommendedModel})과 정상 통신되었습니다.`,
      })
    } catch (err) {
      setVerifyMessage({
        type: 'warn',
        text:
          err instanceof Error
            ? err.message
            : 'API 키 검증에 실패했습니다. 키 값을 다시 확인해 주세요.',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div
      className="overlay-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gemini API 및 통역 엔진 설정"
    >
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Google Gemini API 연동 및 통역 환경 설정</h2>
            <p>
              입력하신 API 키는 외부 서버로 전송되지 않으며, 오직 현재 브라우저에서 Google Gemini
              API로 직접 암호화 통신할 때만 사용됩니다.
            </p>
          </div>
          <button type="button" className="mini-btn" onClick={onClose} aria-label="설정 닫기">
            <X size={16} />
          </button>
        </div>

        {verifyMessage && (
          <div className={`status-banner ${verifyMessage.type}`}>{verifyMessage.text}</div>
        )}

        <div className="form-field">
          <label htmlFor="input-gemini-api-key">Google Gemini API Key</label>
          <div className="input-row">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                id="input-gemini-api-key"
                type={showKey ? 'text' : 'password'}
                className="text-input"
                style={{ paddingRight: 38, fontFamily: 'var(--font-mono)' }}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? '키 숨기기' : '키 보기'}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-tertiary)',
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="field-hint">
            Google AI Studio (aistudio.google.com)에서 발급한 API 키를 입력해 주세요.
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="select-key-persistence">API 키 보관 방식 (보안)</label>
          <select
            id="select-key-persistence"
            className="select-input"
            value={persistence}
            onChange={(e) => setPersistence(e.target.value as StoragePersistence)}
          >
            <option value="local">내 개인 노트북/태블릿 브라우저에 저장 (다음 접속 시 유지)</option>
            <option value="session">공용 PC 모드 — 현재 브라우저 탭을 닫으면 즉시 삭제</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="select-gemini-model">AI 번역·요약 모델</label>
          <select
            id="select-gemini-model"
            className="select-input"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {localModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName}
              </option>
            ))}
          </select>
          <div className="field-hint">
            실시간 통역 현장에서는 응답 지연이 가장 짧은 <strong>자동 최적 선택 (Flash-Lite / Flash)</strong>을 권장합니다.
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="select-audio-engine">음성 받아쓰기(STT) 엔진</label>
          <select
            id="select-audio-engine"
            className="select-input"
            value={audioEngine}
            onChange={(e) => setAudioEngine(e.target.value as AudioEngineMode)}
          >
            <option value="web_speech">
              초고속 실시간 스트리밍 (크롬·엣지·사파리 Web Speech — 권장)
            </option>
            <option value="gemini_audio">
              Gemini AI 직접 음성인식 (약 4초 단위 오디오 분석 — 호환 모드)
            </option>
          </select>
          {!webSpeechAvailable && (
            <div className="field-hint" style={{ color: 'var(--status-warn)' }}>
              현재 브라우저에서는 Web Speech가 감지되지 않아 Gemini 직접 음성인식 모드로 자동 동작합니다.
            </div>
          )}
        </div>

        <div className="form-field">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={enableInterimTranslation}
              onChange={(e) => setEnableInterimTranslation(e.target.checked)}
            />
            <span>화자가 말하는 도중에도 실시간 중간 번역을 미리 갱신하기</span>
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginTop: 20,
            paddingTop: 14,
            borderTop: '1px solid var(--line-hairline)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: '0.76rem',
              color: 'var(--ink-tertiary)',
            }}
          >
            <ShieldCheck size={14} /> 서버 무저장 · 클라이언트 직접 통신
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              닫기
            </button>
            <button
              id="btn-verify-save-key"
              type="button"
              className="primary-btn"
              disabled={isVerifying}
              onClick={handleVerifyAndSave}
            >
              {isVerifying ? (
                <>
                  <Loader2 size={15} />
                  <span>연결 확인 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>연결 확인 및 저장</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
