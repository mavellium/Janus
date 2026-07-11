'use client'

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type ReactNode,
} from 'react'
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
} from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import { DragHandle } from '@tiptap/extension-drag-handle-react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, Color, BackgroundColor } from '@tiptap/extension-text-style'
import { TableKit } from '@tiptap/extension-table'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Youtube } from '@tiptap/extension-youtube'
import { createLowlight, common } from 'lowlight'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  ListTree,
  Link2,
  Unlink,
  Quote,
  ImageIcon,
  Code,
  Table as TableIcon,
  Video as VideoIcon,
  Info,
  Minus,
  Heading2,
  GripVertical,
  Undo2,
  Redo2,
  Loader2,
  Check,
  Plus,
} from 'lucide-react'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import { cn } from '@/lib/utils'
import { ResizableImage } from '@/components/blog/ResizableImage'
import { Callout } from '@/components/blog/extensions/Callout'
import { SlashCommand } from '@/components/blog/extensions/SlashCommand'
import { MediaLibrarySheet } from '@/components/blog/MediaLibrarySheet'
import { uploadBlogMedia } from '@/modules/blog/actions/uploadBlogMedia'
import { countWords, readingMinutes } from '@/lib/reading-time'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  name?: string
  projectId?: string
  className?: string
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

interface HeadingEntry {
  level: number
  text: string
  pos: number
}

const lowlight = createLowlight(common)

const FONT_COLORS = [
  '#111827',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#0ea5e9',
  '#6366f1',
  '#ec4899',
]

const HIGHLIGHT_COLORS = [
  '#fef08a',
  '#fed7aa',
  '#bbf7d0',
  '#bfdbfe',
  '#ddd6fe',
  '#fbcfe8',
  '#fecaca',
  '#e5e7eb',
]

const EDITOR_STYLES = `
.janus-rich-editor .ProseMirror {
  min-height: 300px;
  color: var(--brand-text);
  font-size: 0.95rem;
  line-height: 1.7;
  outline: none;
}
.janus-rich-editor .ProseMirror > * + * { margin-top: 0.75em; }
.janus-rich-editor .ProseMirror h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; margin: 1.2em 0 0.6em; }
.janus-rich-editor .ProseMirror h2 { font-size: 1.6rem; font-weight: 700; line-height: 1.3; margin: 1.1em 0 0.5em; }
.janus-rich-editor .ProseMirror h3 { font-size: 1.3rem; font-weight: 600; line-height: 1.35; margin: 1em 0 0.4em; }
.janus-rich-editor .ProseMirror h4 { font-size: 1.15rem; font-weight: 600; line-height: 1.4; margin: 1em 0 0.4em; }
.janus-rich-editor .ProseMirror h5 { font-size: 1rem; font-weight: 600; line-height: 1.4; margin: 1em 0 0.3em; }
.janus-rich-editor .ProseMirror h6 { font-size: 0.875rem; font-weight: 600; line-height: 1.4; margin: 1em 0 0.3em; color: var(--brand-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.janus-rich-editor .ProseMirror p { margin: 0; }
.janus-rich-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
.janus-rich-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
.janus-rich-editor .ProseMirror li { margin: 0.25em 0; }
.janus-rich-editor .ProseMirror li p { margin: 0; }
.janus-rich-editor .ProseMirror blockquote {
  border-left: 3px solid var(--brand-primary);
  padding-left: 1rem;
  margin: 1em 0;
  color: var(--brand-muted);
  font-style: italic;
}
.janus-rich-editor .ProseMirror a { color: var(--brand-primary); text-decoration: underline; cursor: pointer; }
.janus-rich-editor .ProseMirror s { text-decoration: line-through; }
.janus-rich-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: var(--brand-muted);
  float: left;
  height: 0;
  pointer-events: none;
}
.janus-rich-editor .ProseMirror code {
  background: var(--brand-btn-light);
  border-radius: 0.25rem;
  padding: 0.1em 0.3em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85em;
}
.janus-rich-editor .ProseMirror pre {
  background: var(--brand-btn-light);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85rem;
  overflow-x: auto;
}
.janus-rich-editor .ProseMirror pre code { background: none; padding: 0; font-size: inherit; color: var(--brand-text); }
.janus-rich-editor .ProseMirror pre .hljs-comment, .janus-rich-editor .ProseMirror pre .hljs-quote { color: var(--brand-muted); font-style: italic; }
.janus-rich-editor .ProseMirror pre .hljs-keyword, .janus-rich-editor .ProseMirror pre .hljs-selector-tag, .janus-rich-editor .ProseMirror pre .hljs-literal { color: #c678dd; }
.janus-rich-editor .ProseMirror pre .hljs-string, .janus-rich-editor .ProseMirror pre .hljs-attr { color: #98c379; }
.janus-rich-editor .ProseMirror pre .hljs-number, .janus-rich-editor .ProseMirror pre .hljs-built_in { color: #d19a66; }
.janus-rich-editor .ProseMirror pre .hljs-title, .janus-rich-editor .ProseMirror pre .hljs-function { color: #61afef; }
.janus-rich-editor .ProseMirror ul[data-type='taskList'] { list-style: none; padding-left: 0.25rem; }
.janus-rich-editor .ProseMirror ul[data-type='taskList'] li { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.25em 0; }
.janus-rich-editor .ProseMirror ul[data-type='taskList'] li > label { margin-top: 0.25rem; flex-shrink: 0; user-select: none; }
.janus-rich-editor .ProseMirror ul[data-type='taskList'] li > div { flex: 1; }
.janus-rich-editor .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; table-layout: fixed; overflow: hidden; }
.janus-rich-editor .ProseMirror th, .janus-rich-editor .ProseMirror td { border: 1px solid var(--border); padding: 0.4rem 0.6rem; vertical-align: top; position: relative; }
.janus-rich-editor .ProseMirror th { background: var(--brand-btn-light); font-weight: 600; text-align: left; }
.janus-rich-editor .ProseMirror .selectedCell { background: var(--brand-btn-light); }
.janus-rich-editor .ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 3px; background: var(--brand-primary); pointer-events: none; }
.janus-rich-editor .ProseMirror div[data-callout] {
  border-left: 4px solid var(--brand-primary);
  background: var(--brand-btn-light);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  margin: 1em 0;
}
.janus-rich-editor .ProseMirror div[data-callout][data-variant='warning'] { border-left-color: var(--brand-cta); }
.janus-rich-editor .ProseMirror div[data-callout] > * { margin: 0.25em 0; }
.janus-rich-editor .ProseMirror div[data-youtube-video] { margin: 1em 0; max-width: 100%; }
.janus-rich-editor .ProseMirror div[data-youtube-video] iframe { width: 100%; aspect-ratio: 16 / 9; height: auto; border-radius: 0.5rem; border: 0; }
.janus-rich-editor .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 1.5em 0; }
.janus-rich-editor .ProseMirror figure[data-align] { margin: 0.75em auto; max-width: 100%; }
.janus-rich-editor .ProseMirror figure[data-align='left'] { margin-left: 0; }
.janus-rich-editor .ProseMirror figure[data-align='right'] { margin-right: 0; }
.janus-rich-editor .ProseMirror figure[data-align] img { max-width: 100%; height: auto; border-radius: 0.5rem; display: block; }
.janus-rich-editor .ProseMirror figure[data-align] figcaption { margin-top: 0.4rem; text-align: center; font-size: 0.8rem; color: var(--brand-muted); }
.janus-rich-editor .janus-resizable-image {
  position: relative;
  display: block;
  max-width: 100%;
  margin: 0.75em auto;
}
.janus-rich-editor .janus-resizable-image img {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
.janus-rich-editor .janus-resizable-image.is-selected img {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}
.janus-rich-editor .janus-resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--brand-primary);
  border: 2px solid var(--card);
  border-radius: 9999px;
  z-index: 2;
}
.janus-rich-editor .janus-resize-handle[data-corner='tl'] { left: -6px; top: 28px; cursor: nwse-resize; }
.janus-rich-editor .janus-resize-handle[data-corner='tr'] { right: -6px; top: 28px; cursor: nesw-resize; }
.janus-rich-editor .janus-resize-handle[data-corner='bl'] { left: -6px; bottom: 6px; cursor: nesw-resize; }
.janus-rich-editor .janus-resize-handle[data-corner='br'] { right: -6px; bottom: 6px; cursor: nwse-resize; }
.janus-rich-editor .janus-image-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--card);
}
.janus-rich-editor .janus-image-toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 0.375rem;
  color: var(--brand-muted);
}
.janus-rich-editor .janus-image-toolbar-btn.is-active { background: var(--brand-primary); color: #fff; }
.janus-rich-editor .janus-image-alt-input,
.janus-rich-editor .janus-figcaption-input {
  flex: 1;
  height: 26px;
  min-width: 80px;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: var(--background);
  padding: 0 0.5rem;
  font-size: 0.75rem;
  color: var(--brand-text);
}
.janus-rich-editor .janus-figcaption-input { width: 100%; margin-top: 6px; }
.janus-rich-editor .janus-figcaption { margin-top: 6px; text-align: center; font-size: 0.8rem; color: var(--brand-muted); }
.janus-bubble-menu, .janus-floating-menu {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--card);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}
.janus-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 24px;
  border-radius: 0.375rem;
  color: var(--brand-muted);
  cursor: grab;
}
.janus-drag-handle:hover { background: var(--brand-btn-light); color: var(--brand-text); }
.janus-slash-menu {
  display: flex;
  flex-direction: column;
  min-width: 220px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--card);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.janus-slash-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  text-align: left;
  color: var(--brand-text);
}
.janus-slash-item.is-active, .janus-slash-item:hover { background: var(--brand-btn-light); }
.janus-slash-item svg { color: var(--brand-muted); }
`

function selectEditorUi(editor: Editor) {
  const headings: HeadingEntry[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level as number,
        text: node.textContent,
        pos,
      })
    }
  })

  return {
    isBold: editor.isActive('bold'),
    isItalic: editor.isActive('italic'),
    isUnderline: editor.isActive('underline'),
    isStrike: editor.isActive('strike'),
    isBulletList: editor.isActive('bulletList'),
    isOrderedList: editor.isActive('orderedList'),
    isTaskList: editor.isActive('taskList'),
    isBlockquote: editor.isActive('blockquote'),
    isCodeBlock: editor.isActive('codeBlock'),
    isCallout: editor.isActive('callout'),
    isTable: editor.isActive('table'),
    isLink: editor.isActive('link'),
    isAlignLeft: editor.isActive({ textAlign: 'left' }),
    isAlignCenter: editor.isActive({ textAlign: 'center' }),
    isAlignRight: editor.isActive({ textAlign: 'right' }),
    isAlignJustify: editor.isActive({ textAlign: 'justify' }),
    headingLevel:
      ([1, 2, 3, 4, 5, 6] as const).find((level) =>
        editor.isActive('heading', { level }),
      ) ?? 0,
    color: (editor.getAttributes('textStyle').color as string | undefined) ?? '',
    highlight:
      (editor.getAttributes('textStyle').backgroundColor as string | undefined) ??
      '',
    canUndo: editor.can().undo(),
    canRedo: editor.can().redo(),
    words: countWords(editor.getText()),
    headings,
  }
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
}

function ToolbarButton({
  onClick,
  title,
  active = false,
  disabled = false,
  children,
}: {
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'bg-brand-primary text-white'
          : 'text-brand-muted hover:bg-brand-btn-light hover:text-brand-text',
      )}
    >
      {children}
    </button>
  )
}

function ColorControl({
  title,
  icon,
  value,
  presets,
  onApply,
  onReset,
}: {
  title: string
  icon: ReactNode
  value: string
  presets: string[]
  onApply: (color: string) => void
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-md transition',
          open
            ? 'bg-brand-btn-light text-brand-text'
            : 'text-brand-muted hover:bg-brand-btn-light hover:text-brand-text',
        )}
      >
        {icon}
        <span
          className="mt-px h-1 w-4 rounded-full border border-border"
          style={{ backgroundColor: value || 'transparent' }}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card p-2 shadow-lg">
            <div className="grid grid-cols-4 gap-1.5">
              {presets.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onApply(color)
                    setOpen(false)
                  }}
                  className="h-6 w-6 rounded-md border border-border transition hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-brand-muted">
                <input
                  type="color"
                  value={value || '#000000'}
                  onChange={(e) => onApply(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border border-border bg-transparent p-0"
                />
                Personalizar
              </label>
              <button
                type="button"
                onClick={() => {
                  onReset()
                  setOpen(false)
                }}
                className="text-xs text-brand-muted transition hover:text-destructive"
              >
                Remover
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function LinkControl({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')

  function openPopover() {
    const previous = (editor.getAttributes('link').href as string | undefined) ?? ''
    setUrl(previous)
    setOpen((prev) => !prev)
  }

  function apply() {
    const trimmed = url.trim()
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const href = /^(https?:\/\/|mailto:|tel:)/i.test(trimmed) ? trimmed : `https://${trimmed}`
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setOpen(false)
    setUrl('')
  }

  function remove() {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setOpen(false)
    setUrl('')
  }

  return (
    <div className="relative">
      <ToolbarButton title="Inserir link" active={active || open} onClick={openPopover}>
        <Link2 size={15} />
      </ToolbarButton>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 flex items-center gap-1 rounded-lg border border-border bg-card p-1.5 shadow-lg">
          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                apply()
              }
              if (e.key === 'Escape') setOpen(false)
            }}
            placeholder="https://exemplo.com"
            className="h-8 w-48 rounded-md border border-border bg-background px-2 text-xs text-brand-text outline-none focus:ring-1 focus:ring-ring"
          />
          <button type="button" title="Aplicar link" aria-label="Aplicar link" onClick={apply} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary text-white transition hover:bg-brand-hover">
            <Check size={15} />
          </button>
          <button type="button" title="Remover link" aria-label="Remover link" onClick={remove} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-brand-muted transition hover:bg-brand-btn-light hover:text-destructive">
            <Unlink size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function InsertMenu({
  editor,
  isCodeBlock,
  isCallout,
}: {
  editor: Editor
  isCodeBlock: boolean
  isCallout: boolean
}) {
  const [open, setOpen] = useState(false)
  const [videoOpen, setVideoOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')

  function close() {
    setOpen(false)
    setVideoOpen(false)
    setVideoUrl('')
  }

  function applyVideo() {
    const url = videoUrl.trim()
    if (url !== '') {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
    close()
  }

  const items: Array<{ label: string; icon: ReactNode; active?: boolean; onClick: () => void }> = [
    {
      label: 'Bloco de código',
      icon: <Code size={15} />,
      active: isCodeBlock,
      onClick: () => {
        editor.chain().focus().toggleCodeBlock().run()
        close()
      },
    },
    {
      label: 'Aviso (callout)',
      icon: <Info size={15} />,
      active: isCallout,
      onClick: () => {
        editor.chain().focus().toggleCallout('info').run()
        close()
      },
    },
    {
      label: 'Tabela',
      icon: <TableIcon size={15} />,
      onClick: () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        close()
      },
    },
    {
      label: 'Divisor',
      icon: <Minus size={15} />,
      onClick: () => {
        editor.chain().focus().setHorizontalRule().run()
        close()
      },
    },
  ]

  return (
    <div className="relative">
      <ToolbarButton title="Inserir bloco" active={open} onClick={() => setOpen((prev) => !prev)}>
        <Plus size={15} />
      </ToolbarButton>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-border bg-card p-1.5 shadow-lg">
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={item.onClick}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
                  item.active ? 'bg-brand-primary text-white' : 'text-brand-text hover:bg-brand-btn-light',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVideoOpen((prev) => !prev)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition',
                videoOpen ? 'bg-brand-primary text-white' : 'text-brand-text hover:bg-brand-btn-light',
              )}
            >
              <VideoIcon size={15} />
              Vídeo do YouTube
            </button>
            {videoOpen && (
              <div className="mt-1 flex items-center gap-1 border-t border-border pt-1.5">
                <input
                  autoFocus
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyVideo()
                    }
                    if (e.key === 'Escape') setVideoOpen(false)
                  }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-brand-text outline-none focus:ring-1 focus:ring-ring"
                />
                <button type="button" title="Inserir vídeo" aria-label="Inserir vídeo" onClick={applyVideo} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-primary text-white transition hover:bg-brand-hover">
                  <Check size={15} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function RichEditor({
  value,
  onChange,
  name = 'body',
  projectId,
  className,
}: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [uploading, setUploading] = useState(false)
  const [tocOpen, setTocOpen] = useState(false)

  const uploadAndInsert = useCallback(
    async (file: File, pos?: number) => {
      const instance = editorRef.current
      if (!instance) return
      const result = projectId
        ? await uploadBlogMedia({ file, projectId })
        : await uploadImage({ file, folder: 'blog-content' })
      if (!result.ok || !result.url) return
      const chain = instance.chain().focus()
      if (typeof pos === 'number') chain.setTextSelection(pos)
      chain.setImage({ src: result.url }).run()
    },
    [projectId],
  )

  const editor = useEditor({
    immediatelyRender: false,
    onCreate: ({ editor: created }) => {
      editorRef.current = created
    },
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
        link: { openOnClick: false },
        codeBlock: false,
      }),
      TextStyle,
      Color,
      BackgroundColor,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage.configure({ inline: false, allowBase64: false }),
      CodeBlockLowlight.configure({ lowlight }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ width: 640, height: 360, nocookie: true }),
      Callout,
      SlashCommand,
      Placeholder.configure({
        placeholder: "Escreva o conteúdo do artigo... (digite '/' para blocos)",
      }),
    ],
    content: value || '',
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
    editorProps: {
      attributes: { class: 'focus:outline-none px-4 py-3' },
      transformPastedText(text: string) {
        return text.replace(/\r\n|\r/g, '\n')
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        if (files.length === 0) return false
        event.preventDefault()
        files.forEach((file) => void uploadAndInsert(file))
        return true
      },
      handleDrop: (view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
          f.type.startsWith('image/'),
        )
        if (files.length === 0) return false
        event.preventDefault()
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        })?.pos
        files.forEach((file) => void uploadAndInsert(file, pos))
        return true
      },
    },
  })

  const state = useEditorState({
    editor,
    selector: (ctx) => (ctx.editor ? selectEditorUi(ctx.editor) : null),
  })

  useEffect(() => {
    if (!editor) return
    if (value === editor.getHTML()) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [value, editor])

  if (!editor) return null

  const ui = state ?? selectEditorUi(editor)

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    const result = projectId
      ? await uploadBlogMedia({ file, projectId })
      : await uploadImage({ file, folder: 'blog-content' })
    setUploading(false)
    if (result.ok && result.url) {
      editor.chain().focus().setImage({ src: result.url }).run()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleImageUpload(file)
    e.target.value = ''
  }

  const applyBlock = (blockValue: string) => {
    if (blockValue === 'paragraph') {
      editor.chain().focus().setParagraph().run()
      return
    }
    const level = Number(blockValue.replace('h', '')) as HeadingLevel
    editor.chain().focus().setHeading({ level }).run()
  }

  const goToHeading = (pos: number) => {
    editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run()
    setTocOpen(false)
  }

  const blockValue = ui.headingLevel ? `h${ui.headingLevel}` : 'paragraph'

  return (
    <div className={cn('janus-rich-editor flex flex-col overflow-hidden rounded-lg border border-border bg-brand-bg', className)}>
      <style>{EDITOR_STYLES}</style>

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-border bg-card px-2 py-1.5">
        <select
          aria-label="Estilo do texto"
          value={blockValue}
          onChange={(e) => applyBlock(e.target.value)}
          className="mr-1 h-8 rounded-md border border-border bg-background px-2 text-xs font-medium text-brand-text outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="paragraph">Parágrafo</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="h4">Título 4</option>
          <option value="h5">Título 5</option>
          <option value="h6">Título 6</option>
        </select>

        <Divider />

        <ToolbarButton title="Negrito (Ctrl+B)" active={ui.isBold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton title="Itálico (Ctrl+I)" active={ui.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton title="Sublinhado (Ctrl+U)" active={ui.isUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline size={15} />
        </ToolbarButton>
        <ToolbarButton title="Tachado (Ctrl+Shift+S)" active={ui.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={15} />
        </ToolbarButton>

        <Divider />

        <ColorControl
          title="Cor da fonte"
          icon={<Baseline size={15} />}
          value={ui.color}
          presets={FONT_COLORS}
          onApply={(color) => editor.chain().focus().setColor(color).run()}
          onReset={() => editor.chain().focus().unsetColor().run()}
        />
        <ColorControl
          title="Cor de fundo"
          icon={<Highlighter size={15} />}
          value={ui.highlight}
          presets={HIGHLIGHT_COLORS}
          onApply={(color) => editor.chain().focus().setBackgroundColor(color).run()}
          onReset={() => editor.chain().focus().unsetBackgroundColor().run()}
        />

        <Divider />

        <ToolbarButton title="Alinhar à esquerda" active={ui.isAlignLeft} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton title="Centralizar" active={ui.isAlignCenter} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton title="Alinhar à direita" active={ui.isAlignRight} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={15} />
        </ToolbarButton>
        <ToolbarButton title="Justificar" active={ui.isAlignJustify} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify size={15} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton title="Lista com marcadores" active={ui.isBulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton title="Lista numerada" active={ui.isOrderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <ToolbarButton title="Checklist" active={ui.isTaskList} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks size={15} />
        </ToolbarButton>

        <Divider />

        <LinkControl editor={editor} active={ui.isLink} />
        <ToolbarButton title="Citação" active={ui.isBlockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton title="Inserir imagem" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
        </ToolbarButton>
        {projectId && (
          <MediaLibrarySheet
            projectId={projectId}
            onSelect={(url) => editor.chain().focus().setImage({ src: url }).run()}
          />
        )}

        <Divider />

        <InsertMenu editor={editor} isCodeBlock={ui.isCodeBlock} isCallout={ui.isCallout} />

        <Divider />

        <ToolbarButton
          title="Sumário"
          active={tocOpen}
          disabled={ui.headings.length === 0}
          onClick={() => setTocOpen((open) => !open)}
        >
          <ListTree size={15} />
        </ToolbarButton>
        <ToolbarButton title="Desfazer (Ctrl+Z)" disabled={!ui.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="Refazer (Ctrl+Shift+Z)" disabled={!ui.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={15} />
        </ToolbarButton>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {tocOpen && ui.headings.length > 0 && (
        <div className="border-b border-border bg-card px-3 py-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
            Sumário
          </p>
          <ul className="flex flex-col gap-0.5">
            {ui.headings.map((heading) => (
              <li key={heading.pos} style={{ paddingLeft: (heading.level - 1) * 12 }}>
                <button
                  type="button"
                  onClick={() => goToHeading(heading.pos)}
                  className="truncate text-left text-xs text-brand-text hover:text-brand-primary"
                >
                  {heading.text || 'Sem título'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ui.isTable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-2 py-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
            Tabela
          </span>
          {(
            [
              ['Linha +', () => editor.chain().focus().addRowAfter().run()],
              ['Coluna +', () => editor.chain().focus().addColumnAfter().run()],
              ['Linha −', () => editor.chain().focus().deleteRow().run()],
              ['Coluna −', () => editor.chain().focus().deleteColumn().run()],
            ] as const
          ).map(([label, action]) => (
            <button
              key={label}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={action}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-brand-text transition hover:bg-brand-btn-light"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive transition hover:bg-destructive/20"
          >
            Excluir tabela
          </button>
        </div>
      )}

      <BubbleMenu editor={editor} className="janus-bubble-menu">
        <ToolbarButton title="Negrito (Ctrl+B)" active={ui.isBold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton title="Itálico (Ctrl+I)" active={ui.isItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton title="Sublinhado (Ctrl+U)" active={ui.isUnderline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline size={15} />
        </ToolbarButton>
        <ToolbarButton title="Tachado (Ctrl+Shift+S)" active={ui.isStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={15} />
        </ToolbarButton>
        <LinkControl editor={editor} active={ui.isLink} />
        <ColorControl
          title="Cor da fonte"
          icon={<Baseline size={15} />}
          value={ui.color}
          presets={FONT_COLORS}
          onApply={(color) => editor.chain().focus().setColor(color).run()}
          onReset={() => editor.chain().focus().unsetColor().run()}
        />
        <ColorControl
          title="Cor de fundo"
          icon={<Highlighter size={15} />}
          value={ui.highlight}
          presets={HIGHLIGHT_COLORS}
          onApply={(color) => editor.chain().focus().setBackgroundColor(color).run()}
          onReset={() => editor.chain().focus().unsetBackgroundColor().run()}
        />
      </BubbleMenu>

      <FloatingMenu editor={editor} className="janus-floating-menu">
        <ToolbarButton title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton title="Checklist" onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <ListChecks size={15} />
        </ToolbarButton>
        <ToolbarButton title="Imagem" onClick={() => fileRef.current?.click()}>
          <ImageIcon size={15} />
        </ToolbarButton>
        <ToolbarButton title="Tabela" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon size={15} />
        </ToolbarButton>
      </FloatingMenu>

      <DragHandle editor={editor} className="janus-drag-handle">
        <GripVertical size={16} />
      </DragHandle>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between border-t border-border bg-card px-3 py-1.5 text-xs text-brand-muted">
        <span>
          {ui.words} {ui.words === 1 ? 'palavra' : 'palavras'}
        </span>
        <span>
          {readingMinutes(ui.words) === 0
            ? '—'
            : `${readingMinutes(ui.words)} min de leitura`}
        </span>
      </div>

      <input type="hidden" name={name} value={editor.getHTML()} />
    </div>
  )
}
