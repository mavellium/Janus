'use client'

import { forwardRef, useState } from 'react'
import { Monitor, Smartphone, Tablet, Link2Off } from 'lucide-react'

interface IframePreviewProps {
  url?: string
}

export const IframePreview = forwardRef<HTMLIFrameElement, IframePreviewProps>(function IframePreview({ url }, ref) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const hasUrl = Boolean(url && url.trim().length > 0 && url !== 'about:blank')

  return (
    <div className="flex flex-col h-full w-full bg-brand-bg relative overflow-hidden">
      <div className="flex items-center justify-center gap-2 p-2 border-b border-brand-btn-light bg-brand-bg shrink-0">
        <div className="bg-sidebar-bg border border-brand-btn-light rounded-lg p-1 flex items-center">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-md transition-colors ${
              device === 'desktop'
                ? 'bg-brand-btn-light text-brand-text shadow-sm'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/50'
            }`}
            title="Desktop"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-md transition-colors ${
              device === 'tablet'
                ? 'bg-brand-btn-light text-brand-text shadow-sm'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/50'
            }`}
            title="Tablet"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-md transition-colors ${
              device === 'mobile'
                ? 'bg-brand-btn-light text-brand-text shadow-sm'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/50'
            }`}
            title="Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full relative overflow-y-auto p-4 flex justify-center">
        {!hasUrl ? (
          <div className="h-full w-full flex items-center justify-center border border-dashed border-brand-btn-light rounded-xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-brand-btn-light/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Link2Off className="w-6 h-6 text-brand-muted" />
              </div>
              <h3 className="text-sm font-medium text-brand-text">Preview Indisponível</h3>
              <p className="text-xs text-brand-muted mt-1 max-w-[250px] mx-auto">
                Nenhuma URL de preview configurada para este projeto. Edite as configurações do projeto para adicionar.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`h-full bg-white transition-all duration-300 ease-in-out border overflow-hidden ${
              device === 'mobile'
                ? 'w-full max-w-[375px] h-[812px] border-[8px] border-brand-btn-light rounded-[2rem] shadow-2xl mx-auto'
                : device === 'tablet'
                  ? 'w-full max-w-[768px] h-full border-[6px] border-brand-btn-light rounded-3xl shadow-2xl mx-auto'
                  : 'w-full border-none'
            }`}
          >
            <iframe
              ref={ref}
              src={url}
              className="w-full h-full border-none"
              title="Preview"
            />
          </div>
        )}
      </div>
    </div>
  )
})
