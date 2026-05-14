'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RichEditor } from '@/components/blog/RichEditor'
import { createBlogPost } from '@/modules/blog/actions/createBlogPost'
import { updateBlogPost } from '@/modules/blog/actions/updateBlogPost'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import { Loader2, ImageIcon, X, ArrowLeft, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

interface PostEditorClientProps {
  projectId: string
  companySlug: string
  basePath: string
  authorName: string
  categories: Category[]
  tags: Tag[]
  post?: {
    id: string
    title: string
    subtitle: string | null
    publishedAt: Date
    body: string
    coverImageUrl: string | null
    authorName: string
    categoryId: string | null
    tags: { tag: { id: string; name: string } }[]
    seoTitle: string | null
    seoDescription: string | null
    seoKeywords: string | null
  }
}

export function PostEditorClient({
  projectId,
  companySlug,
  basePath,
  authorName,
  categories,
  tags,
  post,
}: PostEditorClientProps) {
  const router = useRouter()
  const action = post ? updateBlogPost : createBlogPost
  const [state, formAction, isPending] = useActionState(action, { ok: false as const, error: '' })

  const [body, setBody] = useState(post?.body ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? '')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    post?.tags.map(t => t.tag.id) ?? []
  )
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  const defaultDate = post
    ? new Date(post.publishedAt).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

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
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
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
            <h1 className="text-base font-semibold text-brand-text">
              {post ? 'Editar Artigo' : 'Novo Artigo'}
            </h1>
            <p className="text-xs text-brand-muted">{basePath.includes('/sites/') ? 'Site' : 'Landing Page'}</p>
          </div>
        </div>
        <Button form="post-form" type="submit" disabled={isPending} className="gap-2">
          {isPending
            ? <Loader2 size={14} className="animate-spin" />
            : <Check size={14} />
          }
          {post ? 'Salvar' : 'Publicar'}
        </Button>
      </div>

      <form id="post-form" action={formAction} className="flex-1 overflow-y-auto">
        {post && <input type="hidden" name="id" value={post.id} />}
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="companySlug" value={companySlug} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
        {selectedTagIds.map(id => (
          <input key={id} type="hidden" name="tagIds" value={id} />
        ))}

        <div className="max-w-4xl mx-auto px-8 py-6">
          {'error' in state && state.error && (
            <p className="mb-4 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded border border-destructive/20">
              {state.error}
            </p>
          )}

          <Tabs defaultValue="principal">
            <TabsList className="mb-6">
              <TabsTrigger value="principal">Principal</TabsTrigger>
              <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              <TabsTrigger value="midia">Mídia</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="principal" className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <Label>Título *</Label>
                <Input name="title" required defaultValue={post?.title} placeholder="Título do artigo" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Subtítulo</Label>
                <Input name="subtitle" defaultValue={post?.subtitle ?? ''} placeholder="Subtítulo (opcional)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Data de publicação *</Label>
                  <Input name="publishedAt" type="date" required defaultValue={defaultDate} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Autor *</Label>
                  <Input name="authorName" required defaultValue={post?.authorName ?? authorName} placeholder="Nome do autor" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Categoria</Label>
                <select
                  name="categoryId"
                  defaultValue={post?.categoryId ?? ''}
                  className="flex h-9 w-full rounded-md border border-input bg-brand-bg px-3 py-1 text-sm text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">Sem categoria</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-brand-primary text-white border-brand-primary'
                            : 'bg-brand-bg text-brand-muted border-border hover:border-brand-primary hover:text-brand-primary'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="conteudo">
              <div className="flex flex-col gap-1.5">
                <Label>Corpo do Artigo</Label>
                <RichEditor value={body} onChange={setBody} name="body-editor" />
              </div>
            </TabsContent>

            <TabsContent value="midia" className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <Label>Imagem de Capa</Label>
                {coverImageUrl ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                    <Image src={coverImageUrl} alt="Capa" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="absolute top-3 right-3 p-1.5 rounded bg-card/80 text-brand-text hover:bg-card transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    disabled={uploadingCover}
                    className="flex flex-col items-center justify-center gap-2 h-48 border border-dashed border-border rounded-lg text-brand-muted hover:border-brand-primary hover:text-brand-primary transition"
                  >
                    {uploadingCover ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                    <span className="text-sm">{uploadingCover ? 'Enviando...' : 'Selecionar imagem de capa'}</span>
                  </button>
                )}
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <Label>Título SEO</Label>
                <Input name="seoTitle" defaultValue={post?.seoTitle ?? ''} placeholder="Título para mecanismos de busca" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Descrição SEO</Label>
                <textarea
                  name="seoDescription"
                  defaultValue={post?.seoDescription ?? ''}
                  placeholder="Descrição para mecanismos de busca (160 caracteres recomendados)"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-primary resize-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Palavras-chave SEO</Label>
                <Input name="seoKeywords" defaultValue={post?.seoKeywords ?? ''} placeholder="palavra1, palavra2, palavra3" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </div>
  )
}
