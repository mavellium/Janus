'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyleKit } from '@tiptap/extension-text-style'
import { useRef } from 'react'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import {
  Bold, Italic, UnderlineIcon, Heading2, Heading3, List, ListOrdered,
  Link2, ImageIcon, AlignLeft, AlignCenter, AlignRight,
  AArrowUp, AArrowDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  name?: string
}

export function RichEditor({ value, onChange, name = 'body' }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyleKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Escreva o conteúdo do artigo...' }),
    ],
    content: value || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-brand-text',
      },
      transformPastedText(text: string) {
        return text.replace(/\r\n|\r/g, '\n')
      },
    },
  })

  async function handleImageUpload(file: File) {
    const result = await uploadImage({ file, folder: 'blog-content' })
    if (result.ok && result.url && editor) {
      editor.chain().focus().setImage({ src: result.url }).run()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
    e.target.value = ''
  }

  function setLink() {
    const url = window.prompt('URL do link')
    if (!url || !editor) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  if (!editor) return null

  function adjustFontSize(delta: number) {
    const current = editor!.getAttributes('textStyle')?.fontSize as string | undefined
    const currentPx = current ? parseInt(current) : 16
    const newPx = Math.max(10, Math.min(48, currentPx + delta * 2))
    editor!.chain().focus().setFontSize(`${newPx}px`).run()
  }

  const toolbarBtn = (active: boolean) =>
    cn(
      'p-1.5 rounded transition text-sm',
      active
        ? 'bg-brand-primary text-white'
        : 'text-brand-muted hover:bg-brand-btn-light hover:text-brand-text'
    )

  return (
    <div className="border border-brand-btn-light rounded-lg overflow-hidden bg-brand-bg">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-brand-btn-light bg-card">
        <button type="button" title="Negrito" onClick={() => editor.chain().focus().toggleBold().run()} className={toolbarBtn(editor.isActive('bold'))}>
          <Bold size={14} />
        </button>
        <button type="button" title="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()} className={toolbarBtn(editor.isActive('italic'))}>
          <Italic size={14} />
        </button>
        <button type="button" title="Sublinhado" onClick={() => editor.chain().focus().toggleUnderline().run()} className={toolbarBtn(editor.isActive('underline'))}>
          <UnderlineIcon size={14} />
        </button>
        <div className="w-px h-4 bg-brand-btn-light mx-1" />
        <button type="button" title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={toolbarBtn(editor.isActive('heading', { level: 2 }))}>
          <Heading2 size={14} />
        </button>
        <button type="button" title="Título 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={toolbarBtn(editor.isActive('heading', { level: 3 }))}>
          <Heading3 size={14} />
        </button>
        <div className="w-px h-4 bg-brand-btn-light mx-1" />
        <button type="button" title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} className={toolbarBtn(editor.isActive('bulletList'))}>
          <List size={14} />
        </button>
        <button type="button" title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={toolbarBtn(editor.isActive('orderedList'))}>
          <ListOrdered size={14} />
        </button>
        <div className="w-px h-4 bg-brand-btn-light mx-1" />
        <button type="button" title="Aumentar fonte" onClick={() => adjustFontSize(1)} className={toolbarBtn(false)}>
          <AArrowUp size={14} />
        </button>
        <button type="button" title="Diminuir fonte" onClick={() => adjustFontSize(-1)} className={toolbarBtn(false)}>
          <AArrowDown size={14} />
        </button>
        <div className="w-px h-4 bg-brand-btn-light mx-1" />
        <button type="button" title="Alinhar à esquerda" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={toolbarBtn(editor.isActive({ textAlign: 'left' }))}>
          <AlignLeft size={14} />
        </button>
        <button type="button" title="Centralizar" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={toolbarBtn(editor.isActive({ textAlign: 'center' }))}>
          <AlignCenter size={14} />
        </button>
        <button type="button" title="Alinhar à direita" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={toolbarBtn(editor.isActive({ textAlign: 'right' }))}>
          <AlignRight size={14} />
        </button>
        <div className="w-px h-4 bg-brand-btn-light mx-1" />
        <button type="button" title="Link" onClick={setLink} className={toolbarBtn(editor.isActive('link'))}>
          <Link2 size={14} />
        </button>
        <button type="button" title="Inserir imagem" onClick={() => fileRef.current?.click()} className={toolbarBtn(false)}>
          <ImageIcon size={14} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={editor.getHTML()} />
    </div>
  )
}
