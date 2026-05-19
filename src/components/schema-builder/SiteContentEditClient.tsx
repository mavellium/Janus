'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, RotateCw, Hammer } from 'lucide-react'
import { IframePreview } from './IframePreview'
import { AdvancedJsonEditor } from '@/components/cms/AdvancedJsonEditor'
import { DynamicForm } from './DynamicForm'
import { updatePageSchema } from '@/modules/projects/actions/updatePageSchema'
import { updatePageContentData } from '@/modules/projects/actions/updatePageContentData'

interface SiteContentEditClientProps {
  pageId: string
  pageName: string
  schemaData: unknown
  initialContentData: unknown
  isAdvanced: boolean
  previewUrl: string
  backHref: string
  builderHref?: string
}

export function SiteContentEditClient({
  pageId,
  pageName,
  schemaData,
  initialContentData,
  isAdvanced,
  previewUrl,
  backHref,
  builderHref,
}: SiteContentEditClientProps) {
  const [reloadKey, setReloadKey] = useState(0)
  const [isPending, startTransition] = useTransition()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const pendingContentRef = useRef<Record<string, unknown> | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const schemaDataRef = useRef<Record<string, unknown>>(schemaData as Record<string, unknown>)

  const contentDataObj =
    typeof initialContentData === 'object' && initialContentData !== null
      ? (initialContentData as Record<string, unknown>)
      : {}

  const handleSave = () => {
    startTransition(async () => {
      if (isAdvanced) {
        const schemaJson = JSON.stringify(schemaDataRef.current)
        await updatePageSchema({ pageId, schemaJson })
      } else {
        await updatePageContentData({ pageId, contentData: pendingContentRef.current || {} })
      }
      setReloadKey((prev) => prev + 1)
    })
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
      }, 150)
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
          {isAdvanced ? (
            <AdvancedJsonEditor
              pageId={pageId}
              data={(schemaData as Record<string, unknown>) || {}}
              onReplaceData={(d) => { schemaDataRef.current = d; handleContentChange(d) }}
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
        <IframePreview
          key={reloadKey}
          ref={iframeRef}
          url={reloadKey > 0 ? `${previewUrl}?v=${reloadKey}` : previewUrl}
        />
      </div>
    </div>
  )
}
