'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RichEditor } from '@/components/blog/RichEditor'
import { createBlogPost } from '@/modules/blog/actions/createBlogPost'
import { updateBlogPost } from '@/modules/blog/actions/updateBlogPost'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import { Loader2, ImageIcon, X, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CategoryItem {
  id: string
  name: string
  parentId: string | null
}

interface TagItem {
  id: string
  name: string
}

interface CompanyUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface PostCategory {
  category: {
    id: string
    name: string
    parentId: string | null
  }
}

interface PostTag {
  tag: { id: string; name: string }
}

interface PostEditorClientProps {
  projectId: string
  companySlug: string
  basePath: string
  categories: CategoryItem[]
  tags: TagItem[]
  companyUsers: CompanyUser[]
  post?: {
    id: string
    title: string
    subtitle: string | null
    status: 'DRAFT' | 'PUBLISHED'
    publishedAt: Date | null
    body: string
    coverImageUrl: string | null
    authorId: string | null
    authorName: string
    categories: PostCategory[]
    tags: PostTag[]
    seoTitle: string | null
    seoDescription: string | null
    seoKeywords: string | null
  } | null
}

export function PostEditorClient({
  projectId,
  companySlug,
  basePath,
  categories,
  tags,
  companyUsers,
  post,
}: PostEditorClientProps) {
  const router = useRouter()
  const action = post ? updateBlogPost : createBlogPost
  const [state, formAction, isPending] = useActionState(action, { ok: false as const, error: '' })

  const [body, setBody] = useState(post?.body ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(post?.tags.map((t) => t.tag.id) ?? [])
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(post?.status ?? 'DRAFT')
  const [selectedAuthorId, setSelectedAuthorId] = useState(post?.authorId ?? '')

  const initRootCatIds =
    post?.categories.filter((pc) => pc.category.parentId === null).map((pc) => pc.category.id) ?? []
  const initSubCatIds =
    post?.categories.filter((pc) => pc.category.parentId !== null).map((pc) => pc.category.id) ?? []

  const [selectedRootCategoryIds, setSelectedRootCategoryIds] = useState<string[]>(initRootCatIds)
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>(initSubCatIds)

  const rootCategories = categories.filter((c) => c.parentId === null)
  const availableSubCategories = categories.filter(
    (c) => c.parentId !== null && selectedRootCategoryIds.includes(c.parentId),
  )

  const selectedUser = companyUsers.find((u) => u.id === selectedAuthorId) ?? null

  useEffect(() => {
    if (state.ok && 'data' in state && state.data) {
      if (!post) {
        router.push(`${basePath}/blog/posts/${state.data.id}/edit`)
      }
    }
  }, [state, post, basePath, router])

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    const result = await uploadImage({ file, folder: 'blog-covers' })
    if (result.ok && result.url) setCoverImageUrl(result.url)
    setUploadingCover(false)
    e.target.value = ''
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  function toggleRootCategory(id: string) {
    setSelectedRootCategoryIds((prev) => {
      if (prev.includes(id)) {
        const removedChildren = categories.filter((c) => c.parentId === id).map((c) => c.id)
        setSelectedSubCategoryIds((subs) => subs.filter((s) => !removedChildren.includes(s)))
        return prev.filter((r) => r !== id)
      }
      return [...prev, id]
    })
  }

  function toggleSubCategory(id: string) {
    setSelectedSubCategoryIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]))
  }

  function getUserInitials(user: CompanyUser) {
    const display = user.name ?? user.email
    return display
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}/blog/posts`}
            className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-btn-light hover:text-brand-text transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-brand-text line-clamp-1">
              {post ? `Artigo — ${post.title}` : 'Novo Artigo'}
            </h1>
          </div>
        </div>
        <Button form="post-form" type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {post ? 'Atualizar Post' : 'Criar Post'}
        </Button>
      </div>

      <form id="post-form" action={formAction} className="flex-1 overflow-hidden">
        {post && <input type="hidden" name="id" value={post.id} />}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="companySlug" value={companySlug} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="authorId" value={selectedAuthorId} />
        {selectedTagIds.map((id) => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}
        {[...selectedRootCategoryIds, ...selectedSubCategoryIds].map((id) => (
          <input key={id} type="hidden" name="categoryIds" value={id} />
        ))}

        <div className="grid grid-cols-[1fr_320px] h-full overflow-hidden">
          <div className="overflow-y-auto px-8 py-6 flex flex-col gap-6">
            {'error' in state && state.error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded border border-destructive/20">
                {state.error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                name="title"
                required
                defaultValue={post?.title}
                placeholder="Título do artigo"
                className="text-lg font-medium h-11"
              />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest">Topo do Artigo</p>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Subtítulo</Label>
                <Input
                  name="subtitle"
                  defaultValue={post?.subtitle ?? ''}
                  placeholder="Descreva o subtítulo deste artigo"
                  className="text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Corpo do Artigo</Label>
                <RichEditor value={body} onChange={setBody} name="body-editor" />
              </div>
            </div>
          </div>

          <div className="border-l border-border overflow-y-auto">
            <div className="px-5 py-5 flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest">Organização</p>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Imagem de Capa</Label>
                  {coverImageUrl ? (
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border">
                      <Image src={coverImageUrl} alt="Capa" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        className="absolute top-2 right-2 p-1 rounded bg-card/80 text-brand-text hover:bg-card transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverRef.current?.click()}
                      disabled={uploadingCover}
                      className="flex flex-col items-center justify-center gap-2 h-28 border border-dashed border-border rounded-lg text-brand-muted text-xs hover:border-brand-primary hover:text-brand-primary transition"
                    >
                      {uploadingCover ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ImageIcon size={18} />
                      )}
                      {uploadingCover ? 'Enviando...' : 'Arraste uma imagem ou clique no botão'}
                    </button>
                  )}
                  <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Status</Label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={status === 'PUBLISHED'}
                    onClick={() => setStatus((s) => (s === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'))}
                    className={`relative flex items-center w-full h-9 rounded-lg border px-3 gap-2.5 text-xs font-medium transition-colors ${
                      status === 'PUBLISHED'
                        ? 'bg-green-500/10 border-green-500/30 text-green-600'
                        : 'bg-muted/50 border-border text-brand-muted'
                    }`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 transition-colors ${
                        status === 'PUBLISHED' ? 'bg-green-500' : 'bg-brand-muted/50'
                      }`}
                    />
                    {status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Autor</Label>
                  {selectedUser && (
                    <div className="flex items-center gap-2 mb-1">
                      {selectedUser.image ? (
                        <Image
                          src={selectedUser.image}
                          alt={selectedUser.name ?? selectedUser.email}
                          width={24}
                          height={24}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                          {getUserInitials(selectedUser)}
                        </div>
                      )}
                      <span className="text-xs text-brand-text truncate">
                        {selectedUser.name ?? selectedUser.email}
                      </span>
                    </div>
                  )}
                  <select
                    value={selectedAuthorId}
                    onChange={(e) => setSelectedAuthorId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">(Sem autor)</option>
                    {companyUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name ?? u.email}
                      </option>
                    ))}
                  </select>
                </div>

                {rootCategories.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Categorias</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {rootCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleRootCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            selectedRootCategoryIds.includes(cat.id)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'bg-background text-brand-muted border-border hover:border-brand-primary hover:text-brand-primary'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {availableSubCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pl-2 border-l-2 border-border">
                        {availableSubCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleSubCategory(cat.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                              selectedSubCategoryIds.includes(cat.id)
                                ? 'bg-brand-primary text-white border-brand-primary'
                                : 'bg-background text-brand-muted border-border hover:border-brand-primary hover:text-brand-primary'
                            }`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Tags de marcação</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            selectedTagIds.includes(tag.id)
                              ? 'bg-brand-primary text-white border-brand-primary'
                              : 'bg-background text-brand-muted border-border hover:border-brand-primary hover:text-brand-primary'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest">SEO e Descoberta</p>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Título</Label>
                  <Input
                    name="seoTitle"
                    defaultValue={post?.seoTitle ?? ''}
                    placeholder="(Opcional)"
                    className="text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Descrição</Label>
                  <textarea
                    name="seoDescription"
                    defaultValue={post?.seoDescription ?? ''}
                    placeholder="(Opcional)"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Palavras Chave</Label>
                  <Input
                    name="seoKeywords"
                    defaultValue={post?.seoKeywords ?? ''}
                    placeholder="(Opcional)"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
