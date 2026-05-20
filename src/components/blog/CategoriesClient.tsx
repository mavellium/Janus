'use client'

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Loader2, FolderOpen, ImageIcon, X, Globe, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createBlogCategory } from '@/modules/blog/actions/createBlogCategory'
import { updateBlogCategory } from '@/modules/blog/actions/updateBlogCategory'
import { deleteBlogCategory } from '@/modules/blog/actions/deleteBlogCategory'
import { uploadImage } from '@/modules/upload/actions/uploadImage'

interface Category {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  slug: string
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string | null
  isActive: boolean
  parentId: string | null
  parent: { id: string; name: string } | null
  children: { id: string; name: string; isActive: boolean }[]
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
  isActive: boolean
  parentId: string | null
  projectId: string
}

type PanelState = { mode: 'create'; parentId: string | null } | { mode: 'edit'; category: Category }

interface CategoriesClientProps {
  categories: Category[]
  projectId: string
}

interface DeleteModalProps {
  name: string
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}

function DeleteModal({ name, onConfirm, onCancel, deleting }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl p-6 w-80 shadow-xl">
        <h3 className="text-sm font-semibold mb-2">Excluir categoria</h3>
        <p className="text-xs text-brand-muted mb-5">
          Tem certeza que deseja excluir <strong className="text-brand-text">&quot;{name}&quot;</strong>?
          Subcategorias serão desvinculadas.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-md border border-input hover:bg-brand-btn-light transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 transition"
          >
            {deleting && <Loader2 size={12} className="animate-spin" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}

interface EditPanelProps {
  panelState: PanelState
  projectId: string
  onClose: () => void
  onCreated: (data: ActionData) => void
  onUpdated: (data: ActionData) => void
}

function EditPanel({ panelState, projectId, onClose, onCreated, onUpdated }: EditPanelProps) {
  const isEditing = panelState.mode === 'edit'
  const category = isEditing ? panelState.category : null
  const parentId = isEditing ? (category!.parentId ?? '') : (panelState.parentId ?? '')

  const action = isEditing ? updateBlogCategory : createBlogCategory
  const [state, formAction, isPending] = useActionState(action, { ok: false as const, error: '' })
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [seoTitle, setSeoTitle] = useState(category?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(category?.seoDescription ?? '')
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
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
    const result = await uploadImage({ file, folder: 'blog-categories' })
    if (result.ok && result.url) setImageUrl(result.url)
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <span className="text-brand-cta">✏</span>
          {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        </div>
        <button onClick={onClose} className="p-1 rounded text-brand-muted hover:text-foreground transition">
          <X size={16} />
        </button>
      </div>

      <form action={formAction} className="flex-1 overflow-y-auto">
        {isEditing && <input type="hidden" name="id" value={category!.id} />}
        {!isEditing && <input type="hidden" name="projectId" value={projectId} />}
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <input type="hidden" name="parentId" value={parentId} />
        <input type="hidden" name="isActive" value={String(isActive)} />

        <div className="grid grid-cols-2 gap-0 divide-x divide-border">
          <div className="px-5 py-5 flex flex-col gap-5">
            <p className="text-[10px] font-semibold tracking-widest text-brand-muted uppercase flex items-center gap-1.5">
              <FolderOpen size={12} /> Informações Básicas
            </p>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Capa da Categoria</Label>
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
              <Label className="text-xs">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                name="name"
                required
                defaultValue={category?.name}
                placeholder="Nome da categoria"
                className="text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Descrição</Label>
              <textarea
                name="description"
                defaultValue={category?.description ?? ''}
                placeholder="Breve descrição interna ou para exibição..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Status</Label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${isActive ? 'bg-brand-cta' : 'bg-muted'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
                <span className="text-xs text-brand-muted">{isActive ? 'Ativa' : 'Inativa'}</span>
              </div>
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
                defaultValue={category?.seoKeywords ?? ''}
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

        <div className="flex items-center justify-end px-5 py-4 border-t border-border shrink-0">
          <Button type="submit" size="sm" disabled={isPending || uploading}>
            {isPending && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
            {isEditing ? 'Salvar' : 'Criar Categoria'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function CategoriesClient({ categories: initialCategories, projectId }: CategoriesClientProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelState | null>(null)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, startDelete] = useTransition()

  const rootCategories = categories.filter((c) => c.parentId === null)
  const subcategories = selectedRootId ? categories.filter((c) => c.parentId === selectedRootId) : []
  const filteredRoots = rootCategories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleCreated = useCallback((data: ActionData) => {
    setCategories((prev) => {
      const parent = data.parentId ? (prev.find((c) => c.id === data.parentId) ?? null) : null
      const newCat: Category = { ...data, parent: parent ? { id: parent.id, name: parent.name } : null, children: [] }
      return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name))
    })
    setPanel(null)
  }, [])

  const handleUpdated = useCallback((data: ActionData) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== data.id) return c
        const parent = data.parentId ? (prev.find((p) => p.id === data.parentId) ?? null) : null
        return { ...c, ...data, parent: parent ? { id: parent.id, name: parent.name } : null }
      }),
    )
    setPanel(null)
  }, [])

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    startDelete(async () => {
      await deleteBlogCategory(id)
      setCategories((prev) =>
        prev
          .filter((c) => c.id !== id)
          .map((c) => (c.parentId === id ? { ...c, parentId: null, parent: null } : c)),
      )
      if (panel?.mode === 'edit' && panel.category.id === id) setPanel(null)
      if (selectedRootId === id) setSelectedRootId(null)
      setDeleteTarget(null)
    })
  }

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-260px)] min-h-[500px]">
        <div className="w-64 shrink-0 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderOpen size={15} className="text-brand-muted" />
              Categorias
            </div>
            <button
              onClick={() => setPanel({ mode: 'create', parentId: null })}
              className="p-1 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
              title="Nova categoria"
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
            {filteredRoots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <FolderOpen size={28} className="text-brand-muted opacity-30" />
                <p className="text-xs text-brand-muted">Nenhuma categoria</p>
              </div>
            ) : (
              <ul className="py-1">
                {filteredRoots.map((cat) => {
                  const isSelected = selectedRootId === cat.id
                  const subCount = categories.filter((c) => c.parentId === cat.id).length
                  return (
                    <li key={cat.id} className="group relative flex items-center">
                      <button
                        onClick={() => {
                          setSelectedRootId(cat.id)
                          setPanel({ mode: 'edit', category: cat })
                        }}
                        className={`flex-1 text-left px-4 py-2.5 pr-8 text-sm transition ${isSelected ? 'bg-brand-cta/15 text-brand-cta font-medium' : 'text-brand-text hover:bg-brand-btn-light/30'}`}
                      >
                        {cat.name}
                        {subCount > 0 && <span className="ml-1.5 text-[10px] text-brand-muted">({subCount})</span>}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget({ id: cat.id, name: cat.name })
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-brand-muted hover:text-destructive transition"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="w-64 shrink-0 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FolderOpen size={15} className="text-brand-muted" />
              Subcategorias
            </div>
            {selectedRootId && (
              <button
                onClick={() => setPanel({ mode: 'create', parentId: selectedRootId })}
                className="p-1 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                title="Nova subcategoria"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedRootId ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <FolderOpen size={28} className="text-brand-muted opacity-30" />
                <p className="text-xs text-brand-muted text-center px-4">Selecione uma categoria</p>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <FolderOpen size={28} className="text-brand-muted opacity-30" />
                <p className="text-xs text-brand-muted">Nenhuma subcategoria</p>
              </div>
            ) : (
              <ul className="py-1">
                {subcategories.map((sub) => {
                  const isSelected = panel?.mode === 'edit' && panel.category.id === sub.id
                  return (
                    <li key={sub.id} className="group relative flex items-center">
                      <button
                        onClick={() => setPanel({ mode: 'edit', category: sub })}
                        className={`flex-1 text-left px-4 py-2.5 pr-8 text-sm transition ${isSelected ? 'bg-brand-cta/15 text-brand-cta font-medium' : 'text-brand-text hover:bg-brand-btn-light/30'}`}
                      >
                        <span>{sub.name}</span>
                        <span
                          className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${sub.isActive ? 'bg-green-500/15 text-green-600' : 'bg-muted text-brand-muted'}`}
                        >
                          {sub.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget({ id: sub.id, name: sub.name })
                        }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-brand-muted hover:text-destructive transition"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
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
              <FolderOpen size={36} className="opacity-30" />
              <p className="text-sm">
                Selecione uma categoria para editar ou clique em <strong>+</strong> para criar
              </p>
            </div>
          ) : (
            <EditPanel
              key={panel.mode === 'create' ? `create-${panel.parentId ?? 'root'}` : panel.category.id}
              panelState={panel}
              projectId={projectId}
              onClose={() => setPanel(null)}
              onCreated={handleCreated}
              onUpdated={handleUpdated}
            />
          )}
        </div>
      </div>
    </>
  )
}
