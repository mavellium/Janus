'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const RELEASE_BODY_CLASSES = [
  'text-sm text-brand-text leading-relaxed',
  '[&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2',
  '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2',
  '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
  '[&_p]:my-2',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2',
  '[&_li]:my-0.5',
  '[&_a]:text-brand-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_code]:rounded [&_code]:bg-brand-btn-light/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-brand-btn-light/40 [&_pre]:p-3 [&_pre]:my-2',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-brand-btn-light [&_blockquote]:pl-3 [&_blockquote]:text-brand-muted',
  '[&_hr]:my-4 [&_hr]:border-brand-btn-light',
  '[&_img]:max-w-full [&_img]:rounded-lg',
].join(' ')

const COLLAPSED_MAX_HEIGHT_PX = 72

export function ReleaseBody({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const measure = () => setContentHeight(el.scrollHeight)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [html])

  const overflows = contentHeight > COLLAPSED_MAX_HEIGHT_PX + 1

  return (
    <div>
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{ maxHeight: expanded ? contentHeight + 48 : COLLAPSED_MAX_HEIGHT_PX }}
      >
        <div
          ref={contentRef}
          className={RELEASE_BODY_CLASSES}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent transition-opacity duration-500',
            (expanded || !overflows) && 'opacity-0'
          )}
        />
      </div>

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-hover transition-colors"
        >
          {expanded ? 'Mostrar menos' : 'Leia mais'}
          <ChevronDown
            size={14}
            className={cn('transition-transform duration-300', expanded && 'rotate-180')}
          />
        </button>
      )}
    </div>
  )
}
