'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, RotateCw } from 'lucide-react'
import { IframePreview } from './IframePreview'
import { AdvancedJsonEditor } from '@/components/cms/AdvancedJsonEditor'
import { DynamicForm } from './DynamicForm'

interface SiteContentEditClientProps {
  pageId: string
  pageName: string
  schemaData: unknown
  initialContentData: unknown
  isAdvanced: boolean
  previewUrl: string
  backHref: string
}

export function SiteContentEditClient({
  pageId,
  pageName,
  schemaData,
  initialContentData,
  isAdvanced,
  previewUrl,
  backHref,
}: SiteContentEditClientProps) {
  const [reloadKey, setReloadKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const pendingContentRef = useRef<Record<string, unknown> | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const contentDataObj =
    typeof initialContentData === 'object' &&
    initialContentData !== null &&
    !Array.isArray(initialContentData)
      ? (initialContentData as Record<string, unknown>)
      : {}

  const handleSave = () => {
    setReloadKey((prev) => prev + 1)
  }

  const handleReload = () => {
    setReloadKey((prev) => prev + 1)
  }

  const handleContentChange = useCallback(
    (content: Record<string, unknown>) => {
      pendingContentRef.current = content
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        const iframe = iframeRef.current
        const data = pendingContentRef.current
        if (iframe && iframe.contentWindow && data) {
          iframe.contentWindow.postMessage(
            { type: 'janus:content-update', pageId, contentData: data },
            '*',
          )
        }
      }, 400)
    },
    [pageId],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [])

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
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-brand-text bg-brand-btn-light hover:bg-brand-btn-light/80 transition shrink-0"
            title="Recarregar preview"
          >
            <RotateCw className="w-3 h-3" />
            <span className="hidden sm:inline text-[10px]">Reload</span>
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-hidden">
          {isAdvanced ? (
            <AdvancedJsonEditor
              pageId={pageId}
              data={contentDataObj}
              onReplaceData={handleContentChange}
              onSave={handleSave}
              isDevMode={false}
            />
          ) : (
            <DynamicForm
              pageId={pageId}
              schemaData={schemaData}
              initialContentData={initialContentData}
              onSave={handleSave}
              onChange={handleContentChange}
            />
          )}
        </div>
      </div>

      <div className="w-full lg:w-2/3 min-h-[60vh] lg:min-h-0 lg:h-full relative">
        <IframePreview key={reloadKey} ref={iframeRef} url={previewUrl} />
      </div>
    </div>
  )
}
