'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, RotateCw, Hammer, MousePointerClick, Save, Loader2 } from 'lucide-react'
import { IframePreview } from './IframePreview'
import { DynamicForm } from './DynamicForm'
import { DynamicFieldRenderer } from '@/components/cms/DynamicFieldRenderer'
import { MediaUploadModal } from './MediaUploadModal'
import { updatePageSchema } from '@/modules/projects/actions/updatePageSchema'
import { updatePageContentData } from '@/modules/projects/actions/updatePageContentData'
import { uploadMedia } from '@/modules/upload/actions/uploadMedia'

interface SiteContentEditClientProps {
  pageId: string
  pageName: string
  schemaData: unknown
  initialContentData: unknown
  initialUiSchema?: unknown
  isAdvanced: boolean
  previewUrl: string
  backHref: string
  builderHref?: string
}

function setDeep(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  const clone = structuredClone(obj) as Record<string, unknown>
  let curr: unknown = clone
  for (let i = 0; i < path.length - 1; i++) {
    curr = Array.isArray(curr)
      ? (curr as unknown[])[Number(path[i])]
      : (curr as Record<string, unknown>)[path[i]]
  }
  const last = path[path.length - 1]
  if (Array.isArray(curr)) {
    (curr as unknown[])[Number(last)] = value
  } else {
    (curr as Record<string, unknown>)[last] = value
  }
  return clone
}

function getSectionLabel(key: string, uiSchema: Record<string, unknown>): string {
  const config = uiSchema[key]
  if (typeof config === 'object' && config !== null) {
    const label = (config as Record<string, unknown>)['ui:label']
    if (typeof label === 'string') return label
  }
  return key
}

export function SiteContentEditClient({
  pageId,
  pageName,
  schemaData,
  initialContentData,
  initialUiSchema,
  isAdvanced,
  previewUrl,
  backHref,
  builderHref,
}: SiteContentEditClientProps) {
  const [reloadKey, setReloadKey] = useState(0)
  const [isPending, startTransition] = useTransition()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pendingContentRef = useRef<Record<string, unknown> | null>(null)

  const initialDataObj =
    isAdvanced
      ? typeof schemaData === 'object' && schemaData !== null && !Array.isArray(schemaData)
        ? (schemaData as Record<string, unknown>)
        : {}
      : typeof initialContentData === 'object' && initialContentData !== null && !Array.isArray(initialContentData)
        ? (initialContentData as Record<string, unknown>)
        : {}
  const uiSchemaObj =
    typeof initialUiSchema === 'object' && initialUiSchema !== null && !Array.isArray(initialUiSchema)
      ? (initialUiSchema as Record<string, unknown>)
      : {}

  const [localData, setLocalData] = useState<Record<string, unknown>>(initialDataObj)
  const localDataRef = useRef<Record<string, unknown>>(initialDataObj)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [uploadingPaths, setUploadingPaths] = useState<Set<string>>(new Set())
  const [mediaModal, setMediaModal] = useState<{
    open: boolean
    path: string[]
    mediaType: 'image' | 'video'
  }>({ open: false, path: [], mediaType: 'image' })
  const mediaModalPathRef = useRef<string[]>([])

  const sections = Object.keys(localData)

  const sendToIframe = useCallback(
    (data: Record<string, unknown>) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        const iframe = iframeRef.current
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            { type: 'janus:content-update', pageId, contentData: data },
            '*',
          )
        }
      }, 150)
    },
    [pageId],
  )

  const handleFieldChange = useCallback(
    (path: string[], value: unknown) => {
      setLocalData((prev) => {
        const updated = setDeep(prev, path, value)
        localDataRef.current = updated
        sendToIframe(updated)
        return updated
      })
    },
    [sendToIframe],
  )

  const handleOpenMediaModal = useCallback((path: string[], mediaType: 'image' | 'video') => {
    mediaModalPathRef.current = path
    setMediaModal({ open: true, path, mediaType })
  }, [])

  const handleMediaUrlSubmit = useCallback(
    (url: string) => {
      handleFieldChange(mediaModalPathRef.current, url)
      setMediaModal((prev) => ({ ...prev, open: false }))
    },
    [handleFieldChange],
  )

  const handleMediaFileUpload = useCallback(
    async (file: File) => {
      const path = [...mediaModalPathRef.current]
      const pathKey = path.join('.')
      setMediaModal((prev) => ({ ...prev, open: false }))
      setUploadingPaths((prev) => new Set([...prev, pathKey]))
      const result = await uploadMedia({ file, folder: 'media' })
      setUploadingPaths((prev) => {
        const n = new Set(prev)
        n.delete(pathKey)
        return n
      })
      if (result.ok && result.url) {
        handleFieldChange(path, result.url)
      }
    },
    [handleFieldChange],
  )

  const handleSave = () => {
    startTransition(async () => {
      if (isAdvanced) {
        const schemaJson = JSON.stringify(localDataRef.current)
        await updatePageSchema({ pageId, schemaJson })
      } else {
        await updatePageContentData({ pageId, contentData: pendingContentRef.current || {} })
      }
      setReloadKey((prev) => prev + 1)
    })
  }

  const handleReload = () => setReloadKey((prev) => prev + 1)

  const handleContentChange = useCallback(
    (content: Record<string, unknown>) => {
      pendingContentRef.current = content
      sendToIframe(content)
    },
    [sendToIframe],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

  if (isAdvanced) {
    return (
      <div className="grid grid-cols-[250px_1fr_350px] w-full h-full bg-brand-bg overflow-hidden">
        <div className="border-r border-brand-btn-light h-full flex flex-col bg-sidebar-bg">
          <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-brand-btn-light shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <Link
                href={backHref}
                className="flex items-center gap-0.5 text-xs text-brand-muted hover:text-brand-text transition shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </Link>
              <div className="h-4 w-px bg-brand-btn-light" />
              <div className="min-w-0">
                <p className="text-[10px] text-brand-muted">Editar</p>
                <h1 className="text-xs font-semibold text-brand-text truncate">{pageName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReload}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-text bg-brand-btn-light hover:bg-brand-btn-light/80 transition shrink-0"
                title="Recarregar preview"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              {builderHref && (
                <Link
                  href={builderHref}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-text bg-brand-btn-light hover:bg-brand-btn-light/80 transition shrink-0"
                  title="Ir para construtor"
                >
                  <Hammer className="w-3 h-3" />
                </Link>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="shrink-0 px-3 py-2 border-b border-brand-btn-light">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Seções</p>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {sections.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedSection(key)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                  selectedSection === key
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-brand-text bg-transparent hover:bg-brand-btn-light/40'
                }`}
              >
                {getSectionLabel(key, uiSchemaObj)}
              </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="h-full relative">
          <IframePreview
            key={reloadKey}
            ref={iframeRef}
            url={reloadKey > 0 ? `${previewUrl}?v=${reloadKey}` : previewUrl}
          />
        </div>

        <div className="border-l border-brand-btn-light h-full flex flex-col bg-sidebar-bg overflow-hidden">
          {selectedSection === null ? (
            <div className="flex-1 flex items-center justify-center gap-3 text-brand-muted px-6">
              <div className="flex flex-col items-center gap-3">
                <MousePointerClick className="w-10 h-10 opacity-30" />
                <p className="text-sm text-center">Selecione uma seção para editar</p>
              </div>
            </div>
          ) : (
            <>
              <div className="sticky top-0 shrink-0 px-4 py-3 bg-sidebar-bg border-b border-border z-10">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">
                  {getSectionLabel(selectedSection, uiSchemaObj)}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  <DynamicFieldRenderer
                    dataKey={selectedSection}
                    value={localData[selectedSection]}
                    path={[selectedSection]}
                    onChange={handleFieldChange}
                    onOpenMediaModal={handleOpenMediaModal}
                    uploadingPaths={uploadingPaths}
                    uiSchema={uiSchemaObj}
                  />
                </div>
              </div>
            </>
          )}

          <div className="shrink-0 p-3 border-t border-brand-btn-light bg-sidebar-bg">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || uploadingPaths.size > 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-cta text-white hover:bg-brand-cta-hover transition disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

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

  return (
    <div className="flex flex-col lg:flex-row w-full h-full bg-brand-bg overflow-x-hidden lg:overflow-hidden">
      <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-brand-btn-light lg:h-full flex flex-col bg-sidebar-bg">
        <header className="flex items-center justify-between gap-2 px-3 py-2 border-b border-brand-btn-light shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={backHref}
              className="flex items-center gap-0.5 text-xs text-brand-muted hover:text-brand-text transition shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="h-4 w-px bg-brand-btn-light hidden sm:block" />
            <div className="min-w-0">
              <p className="text-[10px] text-brand-muted">Editar</p>
              <h1 className="text-xs font-semibold text-brand-text truncate">{pageName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleReload}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-text bg-brand-btn-light hover:bg-brand-btn-light/80 transition shrink-0"
              title="Recarregar preview"
            >
              <RotateCw className="w-3 h-3" />
              <span className="hidden sm:inline text-[10px]">Reload</span>
            </button>
            {builderHref && (
              <Link
                href={builderHref}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-text bg-brand-btn-light hover:bg-brand-btn-light/80 transition shrink-0"
                title="Ir para construtor"
              >
                <Hammer className="w-3 h-3" />
                <span className="hidden sm:inline text-[10px]">Construtor</span>
              </Link>
            )}
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          <DynamicForm
            pageId={pageId}
            schemaData={schemaData}
            initialContentData={initialContentData}
            onSave={handleSave}
            onChange={handleContentChange}
          />
        </div>
      </div>

      <div className="w-full lg:w-2/3 min-h-[60vh] lg:min-h-0 lg:h-full relative">
        <IframePreview
          key={reloadKey}
          ref={iframeRef}
          url={reloadKey > 0 ? `${previewUrl}?v=${reloadKey}` : previewUrl}
        />
      </div>
    </div>
  )
}
