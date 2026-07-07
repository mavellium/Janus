'use client'

import { useRef, type PointerEvent as ReactPointerEvent, type CSSProperties } from 'react'
import Image from '@tiptap/extension-image'
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImageAlign = 'left' | 'center' | 'right'

const HANDLES: { corner: 'tl' | 'tr' | 'bl' | 'br'; direction: number }[] = [
  { corner: 'tl', direction: -1 },
  { corner: 'tr', direction: 1 },
  { corner: 'bl', direction: -1 },
  { corner: 'br', direction: 1 },
]

const ALIGN_OPTIONS: { value: ImageAlign; icon: typeof AlignLeft; title: string }[] = [
  { value: 'left', icon: AlignLeft, title: 'Alinhar à esquerda' },
  { value: 'center', icon: AlignCenter, title: 'Centralizar' },
  { value: 'right', icon: AlignRight, title: 'Alinhar à direita' },
]

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const width = node.attrs.width as number | null
  const align = (node.attrs.align as ImageAlign) ?? 'center'
  const alt = (node.attrs.alt as string | null) ?? ''
  const caption = (node.attrs.caption as string | null) ?? ''

  const startResize = (
    event: ReactPointerEvent<HTMLSpanElement>,
    direction: number,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const img = imgRef.current
    if (!img) return
    const startX = event.clientX
    const startWidth = img.offsetWidth
    const onMove = (moveEvent: PointerEvent) => {
      const delta = (moveEvent.clientX - startX) * direction
      updateAttributes({ width: Math.round(Math.max(80, startWidth + delta)) })
    }
    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  const wrapperStyle: CSSProperties = {
    width: width ? `${width}px` : undefined,
    marginLeft: align === 'left' ? 0 : 'auto',
    marginRight: align === 'right' ? 0 : 'auto',
  }

  return (
    <NodeViewWrapper
      className={cn('janus-resizable-image', selected && 'is-selected')}
      style={wrapperStyle}
      data-align={align}
    >
      {selected && (
        <div className="janus-image-toolbar" contentEditable={false}>
          {ALIGN_OPTIONS.map(({ value, icon: Icon, title }) => (
            <button
              key={value}
              type="button"
              title={title}
              aria-pressed={align === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ align: value })}
              className={cn(
                'janus-image-toolbar-btn',
                align === value && 'is-active',
              )}
            >
              <Icon size={13} />
            </button>
          ))}
          <input
            value={alt}
            placeholder="Texto alternativo (alt)"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            className="janus-image-alt-input"
          />
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={node.attrs.src as string}
        alt={alt}
        title={(node.attrs.title as string | null) ?? undefined}
        draggable={false}
      />

      {selected &&
        HANDLES.map((handle) => (
          <span
            key={handle.corner}
            data-corner={handle.corner}
            className="janus-resize-handle"
            onPointerDown={(event) => startResize(event, handle.direction)}
          />
        ))}

      {selected ? (
        <input
          value={caption}
          placeholder="Legenda (opcional)"
          contentEditable={false}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          className="janus-figcaption-input"
        />
      ) : (
        caption && <figcaption className="janus-figcaption">{caption}</figcaption>
      )}
    </NodeViewWrapper>
  )
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('width') ?? element.style.width
          return value ? parseInt(value, 10) : null
        },
        renderHTML: () => ({}),
      },
      align: {
        default: 'center',
        renderHTML: () => ({}),
      },
      caption: {
        default: '',
        renderHTML: () => ({}),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (element) => {
          const img = element as HTMLImageElement
          const figure = img.closest('figure')
          const figcaption = figure?.querySelector('figcaption')
          const widthValue = img.getAttribute('width') ?? img.style.width
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: widthValue ? parseInt(widthValue, 10) : null,
            align:
              (figure?.getAttribute('data-align') as ImageAlign | null) ??
              'center',
            caption: figcaption?.textContent ?? '',
          }
        },
      },
    ]
  },

  renderHTML({ node }) {
    const src = node.attrs.src as string
    const alt = (node.attrs.alt as string | null) ?? ''
    const title = (node.attrs.title as string | null) ?? null
    const width = node.attrs.width as number | null
    const align = (node.attrs.align as ImageAlign) ?? 'center'
    const caption = (node.attrs.caption as string | null) ?? ''

    const imgAttrs: Record<string, string | number> = { src }
    if (alt) imgAttrs.alt = alt
    if (title) imgAttrs.title = title
    if (width) {
      imgAttrs.width = width
      imgAttrs.style = `width:${width}px`
    }

    const figureAttrs = { 'data-align': align, class: 'janus-figure' }

    return caption
      ? ['figure', figureAttrs, ['img', imgAttrs], ['figcaption', {}, caption]]
      : ['figure', figureAttrs, ['img', imgAttrs]]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})
