'use client'

import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RichEditor } from '@/components/blog/RichEditor'
import { createBlogPost } from '@/modules/blog/actions/createBlogPost'
import { updateBlogPost } from '@/modules/blog/actions/updateBlogPost'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import {
  Loader2,
  ImageIcon,
  X,
  ArrowLeft,
  Check,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { autosaveBlogPost } from '@/modules/blog/actions/autosaveBlogPost'
import { BlogVersionsSheet } from '@/components/blog/BlogVersionsSheet'
import { BlogPreviewSheet } from '@/components/blog/BlogPreviewSheet'
import { BlogSeoChecklist } from '@/components/blog/BlogSeoChecklist'
import { BlogCommentsSheet } from '@/components/blog/BlogCommentsSheet'
import { cn } from '@/lib/utils'
import type { BlogPostVersionItem } from '@/modules/blog/queries/getBlogPostVersions'
import type { BlogCommentItem } from '@/modules/blog/queries/getBlogComments'

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
  versions?: BlogPostVersionItem[]
  comments?: BlogCommentItem[]
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

function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toIsoOrEmpty(datetimeLocalValue: string): string {
  if (!datetimeLocalValue) return ''
  const date = new Date(datetimeLocalValue)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function formatScheduled(datetimeLocalValue: string): string {
  const date = new Date(datetimeLocalValue)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

const SEO_TITLE_MAX = 60
const SEO_DESCRIPTION_MAX = 160

function seoCounterClass(length: number, min: number, max: number): string {
  if (length > max) return 'text-destructive'
  if (length >= min) return 'text-brand-primary'
  return 'text-brand-muted'
}

export function PostEditorClient({
  projectId,
  companySlug,
  basePath,
  categories,
  tags,
  companyUsers,
  versions = [],
  comments = [],
  post,
}: PostEditorClientProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [postId, setPostId] = useState<string | null>(post?.id ?? null)
  const action = post || postId ? updateBlogPost : createBlogPost
  const [state, formAction, isPending] = useActionState(action, { ok: false as const, error: '' })

  const [body, setBody] = useState(post?.body ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(post?.coverImageUrl ?? null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(post?.tags.map((t) => t.tag.id) ?? [])
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(post?.status ?? 'DRAFT')
  const [selectedAuthorId, setSelectedAuthorId] = useState(post?.authorId ?? '')

  const [title, setTitle] = useState(post?.title ?? '')
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? '')
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? '')
  const [seoKeywords, setSeoKeywords] = useState(post?.seoKeywords ?? '')
  const [publishedAt, setPublishedAt] = useState<string>(
    post?.publishedAt ? toDatetimeLocalValue(new Date(post.publishedAt)) : toDatetimeLocalValue(new Date()),
  )
  const [focusMode, setFocusMode] = useState(false)

  const [autosaveState, setAutosaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const autosaveMountRef = useRef(Boolean(post))
  const [isScheduled, setIsScheduled] = useState(() => {
    if (!post?.publishedAt || post.status !== 'PUBLISHED') return false
    return new Date(post.publishedAt).getTime() > Date.now()
  })

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
  const publishedAtIso = toIsoOrEmpty(publishedAt)

  const [dirty, setDirty] = useState(false)
  const dirtyMountRef = useRef(true)
  const skipNextDirtyCheckRef = useRef(false)

  useEffect(() => {
    if (state.ok && 'data' in state && state.data) {
      startTransition(() => setDirty(false))
      if (!post) {
        router.push(`${basePath}/blog/posts/${state.data.id}/edit`)
      }
    }
  }, [state, post, basePath, router])

  useEffect(() => {
    if (dirtyMountRef.current) {
      dirtyMountRef.current = false
      return
    }
    if (skipNextDirtyCheckRef.current) {
      skipNextDirtyCheckRef.current = false
      return
    }
    setDirty(true)
  }, [
    title,
    subtitle,
    body,
    status,
    coverImageUrl,
    seoTitle,
    seoDescription,
    seoKeywords,
    publishedAt,
    selectedAuthorId,
    selectedTagIds,
    selectedRootCategoryIds,
    selectedSubCategoryIds,
  ])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const hasContent = title.trim() !== '' || stripHtml(body) !== ''
    if (!postId && !hasContent) return
    if (autosaveMountRef.current) {
      autosaveMountRef.current = false
      return
    }

    const timer = setTimeout(async () => {
      setAutosaveState('saving')
      const formData = new FormData()
      if (postId) formData.set('id', postId)
      formData.set('companySlug', companySlug)
      formData.set('projectId', projectId)
      formData.set('title', title)
      formData.set('subtitle', subtitle)
      formData.set('status', status)
      formData.set('body', body)
      formData.set('coverImageUrl', coverImageUrl ?? '')
      formData.set('seoTitle', seoTitle)
      formData.set('seoDescription', seoDescription)
      formData.set('seoKeywords', seoKeywords)
      formData.set('authorId', selectedAuthorId)
      formData.set('publishedAt', publishedAtIso)
      selectedTagIds.forEach((id) => formData.append('tagIds', id))
      ;[...selectedRootCategoryIds, ...selectedSubCategoryIds].forEach((id) =>
        formData.append('categoryIds', id),
      )

      const result = await autosaveBlogPost(formData)
      if (result.ok) {
        setAutosaveState('saved')
        setLastSavedAt(new Date())
        setDirty(false)
        if (!postId && result.data?.id) {
          setPostId(result.data.id)
          window.history.replaceState(null, '', `${basePath}/blog/posts/${result.data.id}/edit`)
        }
      } else {
        setAutosaveState('idle')
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [
    postId,
    companySlug,
    projectId,
    basePath,
    title,
    subtitle,
    status,
    body,
    coverImageUrl,
    seoTitle,
    seoDescription,
    seoKeywords,
    publishedAtIso,
    selectedAuthorId,
    selectedTagIds,
    selectedRootCategoryIds,
    selectedSubCategoryIds,
  ])

  async function uploadCoverFile(file: File) {
    setUploadingCover(true)
    const result = await uploadImage({ file, folder: 'blog-covers' })
    if (result.ok && result.url) setCoverImageUrl(result.url ?? null)
    setUploadingCover(false)
  }

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadCoverFile(file)
    e.target.value = ''
  }

  function handleCoverDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
    if (file) void uploadCoverFile(file)
  }

  function toggleStatus() {
    setStatus((s) => {
      const next = s === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
      if (next === 'DRAFT') {
        setIsScheduled(false)
        return next
      }
      const effective = post?.publishedAt ? publishedAt : toDatetimeLocalValue(new Date())
      if (!post?.publishedAt) setPublishedAt(effective)
      const ms = new Date(effective).getTime()
      setIsScheduled(!Number.isNaN(ms) && ms > Date.now())
      return next
    })
  }

  function handlePublishedAtChange(value: string) {
    setPublishedAt(value)
    const ms = value ? new Date(value).getTime() : NaN
    setIsScheduled(!Number.isNaN(ms) && ms > Date.now())
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

  function handleBackClick(e: React.MouseEvent) {
    if (dirty && !window.confirm('Você tem alterações não salvas. Sair mesmo assim?')) {
      e.preventDefault()
    }
  }

  function handleVersionRestored(data: {
    title: string
    subtitle: string | null
    body: string
    coverImageUrl: string | null
    seoTitle: string | null
    seoDescription: string | null
    seoKeywords: string | null
  }) {
    skipNextDirtyCheckRef.current = true
    setTitle(data.title)
    setSubtitle(data.subtitle ?? '')
    setBody(data.body)
    setCoverImageUrl(data.coverImageUrl)
    setSeoTitle(data.seoTitle ?? '')
    setSeoDescription(data.seoDescription ?? '')
    setSeoKeywords(data.seoKeywords ?? '')
    setDirty(false)
  }

  const effectivePostId = post?.id ?? postId
  const hasExistingPost = Boolean(effectivePostId)
  const submitLabel = post ? 'Atualizar Post' : postId ? 'Salvar Post' : 'Criar Post'

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}/blog/posts`}
            onClick={handleBackClick}
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
        <div className="flex items-center gap-2">
          {hasExistingPost && autosaveState !== 'idle' && (
            <span className="flex items-center gap-1 text-xs text-brand-muted">
              {autosaveState === 'saving' ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={12} />
                  {lastSavedAt
                    ? `Salvo às ${lastSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Salvo automaticamente'}
                </>
              )}
            </span>
          )}
          <button
            type="button"
            title={focusMode ? 'Sair do modo foco' : 'Modo foco'}
            onClick={() => setFocusMode((f) => !f)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm text-brand-text transition hover:bg-brand-btn-light"
          >
            {focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span className="hidden sm:inline">{focusMode ? 'Sair do foco' : 'Modo foco'}</span>
          </button>
          <BlogPreviewSheet
            title={title}
            subtitle={subtitle}
            coverImageUrl={coverImageUrl}
            body={body}
          />
          {effectivePostId && <BlogCommentsSheet postId={effectivePostId} comments={comments} />}
          {effectivePostId && (
            <BlogVersionsSheet versions={versions} onRestored={handleVersionRestored} />
          )}
          <Button form="post-form" type="submit" disabled={isPending} className="gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>

      <form
        id="post-form"
        ref={formRef}
        action={formAction}
        className="flex-1 overflow-y-auto lg:overflow-hidden"
      >
        {hasExistingPost && <input type="hidden" name="id" value={post?.id ?? postId ?? ''} />}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="companySlug" value={companySlug} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="coverImageUrl" value={coverImageUrl ?? ''} />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="authorId" value={selectedAuthorId} />
        <input type="hidden" name="publishedAt" value={publishedAtIso} />
        {selectedTagIds.map((id) => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}
        {[...selectedRootCategoryIds, ...selectedSubCategoryIds].map((id) => (
          <input key={id} type="hidden" name="categoryIds" value={id} />
        ))}

        <div
          className={cn(
            'grid grid-cols-1 lg:h-full lg:overflow-hidden',
            focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[1fr_320px]',
          )}
        >
          <div className="lg:overflow-y-auto px-8 py-6 flex flex-col gap-4 lg:h-full">
            {'error' in state && state.error && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded border border-destructive/20 shrink-0">
                {state.error}
              </p>
            )}

            <div className="flex flex-col gap-1.5 shrink-0">
              <Label className="text-xs font-semibold">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                name="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do artigo"
                className="text-lg font-medium h-11"
              />
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <Label className="text-xs">Subtítulo</Label>
              <Input
                name="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Descreva o subtítulo deste artigo"
                className="text-sm"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-1.5">
              <Label className="text-xs shrink-0">Corpo do Artigo</Label>
              <RichEditor
                value={body}
                onChange={setBody}
                name="body-editor"
                projectId={projectId}
                className="min-h-[300px] lg:flex-1"
              />
            </div>
          </div>

          {!focusMode && (
            <div className="border-t lg:border-t-0 lg:border-l border-border lg:overflow-y-auto">
              <div className="px-5 py-5 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-widest">Organização</p>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Imagem de Capa</Label>
                    {coverImageUrl ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverImageUrl} alt="Capa" className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCoverImageUrl(null)}
                          className="flex items-center gap-1 text-xs text-brand-muted hover:text-destructive transition w-fit"
                        >
                          <X size={12} />
                          Remover capa
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => coverRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleCoverDrop}
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
                      onClick={toggleStatus}
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

                  {status === 'PUBLISHED' && (
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Publicar em</Label>
                      <input
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) => handlePublishedAtChange(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      {isScheduled && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-brand-cta">
                          <Clock size={12} />
                          Agendado para {formatScheduled(publishedAt)}
                        </span>
                      )}
                    </div>
                  )}

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

                  <BlogSeoChecklist
                    title={title}
                    seoTitle={seoTitle}
                    seoDescription={seoDescription}
                    seoKeywords={seoKeywords}
                    body={body}
                  />

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Título</Label>
                      <span className={cn('text-[10px]', seoCounterClass(seoTitle.length, 30, SEO_TITLE_MAX))}>
                        {seoTitle.length}/{SEO_TITLE_MAX}
                      </span>
                    </div>
                    <Input
                      name="seoTitle"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="(Opcional)"
                      className="text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Descrição</Label>
                      <span
                        className={cn(
                          'text-[10px]',
                          seoCounterClass(seoDescription.length, 70, SEO_DESCRIPTION_MAX),
                        )}
                      >
                        {seoDescription.length}/{SEO_DESCRIPTION_MAX}
                      </span>
                    </div>
                    <textarea
                      name="seoDescription"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="(Opcional)"
                      rows={3}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Palavras Chave</Label>
                    <Input
                      name="seoKeywords"
                      value={seoKeywords}
                      onChange={(e) => setSeoKeywords(e.target.value)}
                      placeholder="(Opcional)"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
