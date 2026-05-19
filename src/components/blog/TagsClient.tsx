'use client'

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Loader2, Tag, ImageIcon, X, Globe, Trash2, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createBlogTag } from '@/modules/blog/actions/createBlogTag'
import { updateBlogTag } from '@/modules/blog/actions/updateBlogTag'
import { deleteBlogTag } from '@/modules/blog/actions/deleteBlogTag'
import { uploadImage } from '@/modules/upload/actions/uploadImage'

interface BlogTag {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  slug: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  parentId: string | null
  parent: { id: string; name: string } | null
  children: { id: string; name: string }[]
}

type ActionData = {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  slug: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  parentId: string | null
  projectId: string
}

interface TagsClientProps {
  tags: BlogTag[]
  projectId: string
}

interface EditPanelProps {
  tag: BlogTag | null
  projectId: string
  allTags: BlogTag[]
  onClose: () => void
  onDeleted: (id: string) => void
  onCreated: (data: ActionData) => void
  onUpdated: (data: ActionData) => void
  onParentCreated: (data: ActionData) => void
}

function EditPanel({
  tag,
  projectId,
  allTags,
  onClose,
  onDeleted,
  onCreated,
  onUpdated,
  onParentCreated,
}: EditPanelProps) {
  const isEditing = tag !== null
  const action = isEditing ? updateBlogTag : createBlogTag
  const [state, formAction, isPending] = useActionState(action, { ok: false as const, error: '' })
  const [imageUrl, setImageUrl] = useState(tag?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [seoTitle, setSeoTitle] = useState(tag?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(tag?.seoDescription ?? '')
  const [selectedParentId, setSelectedParentId] = useState(tag?.parentId ?? '')
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, startDelete] = useTransition()
  const [creatingParent, startCreateParent] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!state.ok) return
    const data = (state as { ok: true; data: ActionData }).data
    if (isEditing) onUpdated(data)
    else onCreated(data)
  }, [state, isEditing, onCreated, onUpdated])

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await uploadImage({ file, folder: 'blog-tags' })
    if (result.ok && result.url) setImageUrl(result.url)
    setUploading(false)
    e.target.value = ''
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    startDelete(async () => {
      await deleteBlogTag(tag!.id)
      onDeleted(tag!.id)
    })
  }

  function handleCreateParent() {
    if (!quickName.trim()) return
    startCreateParent(async () => {
      const fd = new FormData()
      fd.set('projectId', projectId)
      fd.set('name', quickName.trim())
      const result = await createBlogTag(null, fd)
      if (result.ok && 'data' in result && result.data) {
        onParentCreated(result.data as ActionData)
        setSelectedParentId(result.data.id)
        setShowQuickCreate(false)
        setQuickName('')
      }
    })
  }

  const parentOptions = allTags.filter((t) => t.id !== tag?.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <span className="text-brand-cta">✏</span>
          {isEditing ? 'Editar Tag' : 'Nova Tag'}
        </div>
        <button onClick={onClose} className="p-1 rounded text-brand-muted hover:text-foreground transition">
          <X size={16} />
        </button>
      </div>

      <form action={formAction} className="flex-1 overflow-y-auto">
        {isEditing && <input type="hidden" name="id" value={tag.id} />}
        {!isEditing && <input type="hidden" name="projectId" value={projectId} />}
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input type="hidden" name="parentId" value={selectedParentId} />

        <div className="grid grid-cols-2 gap-0 divide-x divide-border">
          <div className="px-5 py-5 flex flex-col gap-5">
            <p className="text-[10px] font-semibold tracking-widest text-brand-muted uppercase flex items-center gap-1.5">
              <Tag size={12} /> Informações Básicas
            </p>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Nome <span className="text-destructive">*</span></Label>
              <Input name="name" required defaultValue={tag?.name} placeholder="Nome da tag" className="text-sm" />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Descrição</Label>
              <textarea
                name="description"
                defaultValue={tag?.description ?? ''}
                placeholder="Breve descrição interna ou para exibição..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Capa da Tag</Label>
              <p className="text-[10px] text-brand-muted">Recomendado: 800x600px</p>
              {imageUrl ? (
                <div className="relative w-full h-28 rounded-lg overflow-hidden border border-border">
                  <Image src={imageUrl} alt="capa" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1 rounded bg-card/80 text-brand-text hover:bg-card transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-2 h-24 border border-dashed border-border rounded-lg text-brand-muted text-xs hover:border-brand-primary hover:text-brand-primary transition"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                  {uploading ? 'Enviando...' : 'Arraste uma imagem ou clique no botão'}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Tag Pai</Label>
              <div className="flex gap-2">
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Nenhuma (raiz)</option>
                  {parentOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowQuickCreate((v) => !v); setQuickName('') }}
                  className="px-2.5 py-1.5 rounded-md border border-input bg-background text-xs text-brand-muted hover:text-brand-primary hover:border-brand-primary transition whitespace-nowrap"
                >
                  + Nova
                </button>
              </div>
              {showQuickCreate && (
                <div className="flex gap-2 mt-1">
                  <Input
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Nome da nova tag pai"
                    className="text-sm flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateParent() } }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateParent}
                    disabled={creatingParent || !quickName.trim()}
                    className="p-1.5 rounded-md bg-brand-cta text-white disabled:opacity-50 transition"
                  >
                    {creatingParent ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowQuickCreate(false); setQuickName('') }}
                    className="p-1.5 rounded-md border border-input text-brand-muted hover:text-foreground transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 py-5 flex flex-col gap-5">
            <p className="text-[10px] font-semibold tracking-widest text-brand-muted uppercase flex items-center gap-1.5">
              <Globe size={12} /> SEO &amp; Descoberta
            </p>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Título SEO</Label>
                <span className="text-[10px] text-brand-muted">{seoTitle.length}/60</span>
              </div>
              <Input
                name="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={60}
                placeholder="Título para o Google..."
                className="text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Descrição SEO</Label>
                <span className="text-[10px] text-brand-muted">{seoDescription.length}/160</span>
              </div>
              <textarea
                name="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={160}
                placeholder="Meta description para resultados de busca..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Palavras-chave</Label>
              <Input
                name="seoKeywords"
                defaultValue={tag?.seoKeywords ?? ''}
                placeholder="Ex: dicas, tutoriais, blog (separadas por vírgula)"
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {'error' in state && state.error && (
          <p className="mx-5 mb-3 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded border border-destructive/20">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-t border-border shrink-0">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition ${confirmDelete ? 'bg-destructive/10 text-destructive' : 'text-brand-muted hover:text-destructive hover:bg-destructive/10'}`}
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              {confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" disabled={isPending || uploading}>
            {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            {isEditing ? 'Salvar' : 'Criar Tag'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function TagsClient({ tags: initialTags, projectId }: TagsClientProps) {
  const [tags, setTags] = useState(initialTags)
  const [panel, setPanel] = useState<'create' | BlogTag | null>(null)
  const [search, setSearch] = useState('')

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))

  const handleDeleted = useCallback((id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id))
    setPanel(null)
  }, [])

  const handleCreated = useCallback((data: ActionData) => {
    setTags((prev) => {
      const parent = data.parentId ? (prev.find((t) => t.id === data.parentId) ?? null) : null
      const newTag: BlogTag = {
        ...data,
        parent: parent ? { id: parent.id, name: parent.name } : null,
        children: [],
      }
      return [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name))
    })
    setPanel(null)
  }, [])

  const handleUpdated = useCallback((data: ActionData) => {
    setTags((prev) =>
      prev.map((t) => {
        if (t.id !== data.id) return t
        const parent = data.parentId ? (prev.find((p) => p.id === data.parentId) ?? null) : null
        return { ...t, ...data, parent: parent ? { id: parent.id, name: parent.name } : null }
      }),
    )
    setPanel(null)
  }, [])

  const handleParentCreated = useCallback((data: ActionData) => {
    const newTag: BlogTag = { ...data, parent: null, children: [] }
    setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
  }, [])

  return (
    <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">
      <div className="w-72 shrink-0 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Tag size={15} className="text-brand-muted" />
            Tags
          </div>
          <button
            onClick={() => setPanel('create')}
            className="p-1 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
            title="Nova tag"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-border">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-background border border-input rounded-md pl-3 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Tag size={28} className="text-brand-muted opacity-30" />
              <p className="text-xs text-brand-muted">Nenhuma tag</p>
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((tag) => {
                const isSelected = panel !== null && panel !== 'create' && (panel as BlogTag).id === tag.id
                return (
                  <li key={tag.id}>
                    <button
                      onClick={() => setPanel(tag)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition ${isSelected ? 'bg-brand-cta/15 text-brand-cta font-medium' : 'text-brand-text hover:bg-brand-btn-light/30'}`}
                    >
                      {tag.name}
                      {tag.parent && (
                        <span className="ml-2 text-[10px] text-brand-muted">↳ {tag.parent.name}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
        {panel === null ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-brand-muted">
            <Tag size={36} className="opacity-30" />
            <p className="text-sm">Selecione uma tag para editar ou clique em <strong>+</strong> para criar</p>
          </div>
        ) : (
          <EditPanel
            key={panel === 'create' ? 'create' : (panel as BlogTag).id}
            tag={panel === 'create' ? null : (panel as BlogTag)}
            projectId={projectId}
            allTags={tags}
            onClose={() => setPanel(null)}
            onDeleted={handleDeleted}
            onCreated={handleCreated}
            onUpdated={handleUpdated}
            onParentCreated={handleParentCreated}
          />
        )}
      </div>
    </div>
  )
}
