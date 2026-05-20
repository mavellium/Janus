'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { Save, Loader2, CheckCircle2, AlertCircle, Plus, Code2 } from 'lucide-react'
import { DynamicFieldRenderer } from './DynamicFieldRenderer'
import { MediaUploadModal } from '@/components/schema-builder/MediaUploadModal'
import { updatePageContentData } from '@/modules/projects/actions/updatePageContentData'
import { uploadMedia } from '@/modules/upload/actions/uploadMedia'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-card text-brand-muted">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  ),
})

const INBUILT_TEMPLATES: { label: string; template: Record<string, unknown> }[] = [
  {
    label: 'Nova Seção',
    template: { title: '', subtitle: '', backgroundImage: '', active: true },
  },
  {
    label: 'Lista',
    template: { items: [{ title: '', description: '', imageUrl: '' }] },
  },
  {
    label: 'Parágrafos',
    template: { paragraphs: ['', ''] },
  },
  {
    label: 'CTA',
    template: { cta: { text: 'Saiba Mais', href: '/', icon: '' } },
  },
  {
    label: 'Hero',
    template: {
      title: '',
      subtitle: '',
      backgroundImage: '',
      cta: { text: '', href: '/', icon: '' },
      active: true,
    },
  },
]

interface AdvancedJsonEditorProps {
  pageId: string
  data: Record<string, unknown>
  onReplaceData?: (data: Record<string, unknown>) => void
  onDataChange?: (data: Record<string, unknown>) => void
  onSave?: () => void
  isDevMode: boolean
}

interface MediaModalState {
  open: boolean
  path: string[]
  mediaType: 'image' | 'video'
}

function setDeep(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) return obj
  const clone = structuredClone(obj)
  let current: Record<string, unknown> | unknown[] = clone
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    const nextKey = path[i + 1]
    const isNextIndex = /^\d+$/.test(nextKey)
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10)
      if (current[idx] === undefined || current[idx] === null) {
        current[idx] = isNextIndex ? [] : {}
      }
      current = current[idx] as Record<string, unknown> | unknown[]
    } else {
      const rec = current as Record<string, unknown>
      if (rec[key] === undefined || rec[key] === null) {
        rec[key] = isNextIndex ? [] : {}
      }
      current = rec[key] as Record<string, unknown> | unknown[]
    }
  }
  const lastKey = path[path.length - 1]
  if (Array.isArray(current)) {
    ;(current as unknown[])[parseInt(lastKey, 10)] = value
  } else {
    ;(current as Record<string, unknown>)[lastKey] = value
  }
  return clone
}

function isComplexValue(v: unknown): boolean {
  return (
    typeof v === 'object' ||
    Array.isArray(v) ||
    (typeof v === 'string' && v.length > 50)
  )
}

export function AdvancedJsonEditor({
  pageId,
  data,
  onReplaceData,
  onDataChange,
  onSave,
  isDevMode,
}: AdvancedJsonEditorProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(data)
  const [rawJson, setRawJson] = useState(() => JSON.stringify(data, null, 2))
  const [isJsonValid, setIsJsonValid] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )
  const [uploadingPaths, setUploadingPaths] = useState<Set<string>>(new Set())
  const [mediaModal, setMediaModal] = useState<MediaModalState>({
    open: false,
    path: [],
    mediaType: 'image',
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const fireReplace = useCallback(
    (next: Record<string, unknown>) => {
      if (!onReplaceData) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onReplaceData(next), 400)
    },
    [onReplaceData],
  )

  const handleFieldChange = useCallback(
    (path: string[], value: unknown) => {
      setLocalData((prev) => {
        const next = setDeep(prev, path, value)
        fireReplace(next)
        onDataChange?.(next)
        return next
      })
    },
    [fireReplace, onDataChange],
  )

  const handleRawJsonChange = (val: string | undefined) => {
    const str = val ?? ''
    setRawJson(str)
    try {
      const parsed = JSON.parse(str)
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const next = parsed as Record<string, unknown>
        setLocalData(next)
        setIsJsonValid(true)
        fireReplace(next)
        onDataChange?.(next)
      } else {
        setIsJsonValid(false)
      }
    } catch {
      setIsJsonValid(false)
    }
  }

  const handleInjectTemplate = (template: Record<string, unknown>) => {
    const next = { ...localData, ...template }
    setLocalData(next)
    setRawJson(JSON.stringify(next, null, 2))
    onReplaceData?.(next)
    onDataChange?.(next)
  }

  const handleSave = () => {
    setFeedback(null)
    startTransition(async () => {
      const result = await updatePageContentData({ pageId, contentData: localData })
      if (result.ok) {
        setFeedback({ type: 'success', message: 'Salvo com sucesso!' })
        onSave?.()
        setTimeout(() => setFeedback(null), 3000)
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Erro ao salvar' })
      }
    })
  }

  const handleOpenMediaModal = (path: string[], mediaType: 'image' | 'video') => {
    setMediaModal({ open: true, path, mediaType })
  }

  const handleMediaUrlSubmit = (url: string) => {
    handleFieldChange(mediaModal.path, url)
    setMediaModal((prev) => ({ ...prev, open: false }))
  }

  const handleMediaFileUpload = async (file: File) => {
    const pathKey = mediaModal.path.join('.')
    const currentPath = mediaModal.path
    setUploadingPaths((prev) => new Set([...prev, pathKey]))
    const result = await uploadMedia({ file, folder: 'media' })
    setUploadingPaths((prev) => {
      const n = new Set(prev)
      n.delete(pathKey)
      return n
    })
    if (result.ok && result.url) {
      handleFieldChange(currentPath, result.url)
      setMediaModal((prev) => ({ ...prev, open: false }))
    }
  }

  const entries = Object.entries(localData)

  const formPanel = (
    <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3">
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 border border-dashed border-border rounded-lg text-brand-muted text-sm gap-2">
          <Code2 className="w-8 h-8 opacity-40" />
          <span>Nenhum campo. Adicione um template ou edite o JSON.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:gap-3">
          {entries.map(([key, val]) => (
            <div
              key={key}
              className="space-y-1.5"
            >
              <label className="block text-[11px] sm:text-xs font-medium text-brand-muted capitalize truncate">{key}</label>
              <DynamicFieldRenderer
                dataKey={key}
                value={val}
                path={[key]}
                onChange={handleFieldChange}
                onOpenMediaModal={handleOpenMediaModal}
                uploadingPaths={uploadingPaths}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      {isDevMode ? (
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          <div className="flex flex-col w-full lg:w-2/5 border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
            <div className="px-2.5 py-1.5 border-b border-border shrink-0 flex items-center gap-1.5 bg-card">
              <span className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide">
                JSON
              </span>
              {!isJsonValid && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  Inválido
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language="json"
                value={rawJson}
                onChange={handleRawJsonChange}
                theme={isDark ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2,
                  fontSize: 13,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
            <div className="shrink-0 px-2.5 py-1.5 border-t border-border bg-card">
              <p className="text-[10px] font-semibold text-brand-muted uppercase tracking-wide mb-1.5">
                Templates
              </p>
              <div className="flex flex-wrap gap-1">
                {INBUILT_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => handleInjectTemplate(t.template)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-brand-btn-light hover:bg-brand-btn-light/80 rounded transition text-brand-text whitespace-nowrap"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{formPanel}</div>
        </div>
      ) : (
        formPanel
      )}

      {!isDevMode && (
        <div className="shrink-0 px-3 py-2 border-t border-border bg-card flex items-center justify-between gap-2">
          <div className="text-[10px] min-w-0">
            {feedback && (
              <span
                className={`flex items-center gap-1 ${
                  feedback.type === 'success' ? 'text-brand-primary' : 'text-destructive'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">{feedback.message}</span>
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isPending || !isJsonValid}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-60 shrink-0"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="hidden sm:inline">{isPending ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </div>
      )}

      <MediaUploadModal
        isOpen={mediaModal.open}
        onClose={() => setMediaModal((prev) => ({ ...prev, open: false }))}
        onUrlSubmit={handleMediaUrlSubmit}
        onFileUpload={handleMediaFileUpload}
        mediaType={mediaModal.mediaType}
        isUploading={uploadingPaths.has(mediaModal.path.join('.'))}
      />
    </div>
  )
}
