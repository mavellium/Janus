'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'
import { sanitizeArticleHtml } from '@/lib/sanitize-html'
import { readingTimeFromHtml } from '@/lib/reading-time'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  projectId: z.string().uuid(),
  companySlug: z.string(),
  title: z.string().min(1),
  slug: z.string().optional(),
  subtitle: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  body: z.string().default(''),
  coverImageUrl: z.string().optional(),
  authorId: z.string().uuid().optional(),
  readingTime: z.coerce.number().int().positive().optional(),
  categoryIds: z.array(z.string().uuid()).default([]),
  tagIds: z.array(z.string().uuid()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  publishedAt: z.string().optional(),
})

function parsePublishedAt(value?: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function createBlogPost(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)
  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean)

  const parsed = schema.safeParse({
    projectId: formData.get('projectId'),
    companySlug: formData.get('companySlug'),
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    subtitle: formData.get('subtitle') || undefined,
    status: formData.get('status') || 'DRAFT',
    body: formData.get('body') || '',
    coverImageUrl: formData.get('coverImageUrl') || undefined,
    authorId: formData.get('authorId') || undefined,
    readingTime: formData.get('readingTime') || undefined,
    categoryIds,
    tagIds,
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
    publishedAt: formData.get('publishedAt') || undefined,
  })
  if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }

  const {
    tagIds: ids,
    categoryIds: catIds,
    projectId,
    companySlug,
    slug,
    authorId,
    status,
    publishedAt: publishedAtInput,
    ...rest
  } = parsed.data
  const resolvedSlug = slug ? slugify(slug) : slugify(rest.title)
  const scheduledAt = parsePublishedAt(publishedAtInput)
  const publishedAt = status === 'PUBLISHED' ? (scheduledAt ?? new Date()) : null
  const cleanBody = sanitizeArticleHtml(rest.body)
  const readingTime = readingTimeFromHtml(cleanBody) || null

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
    })
    if (!company) return { ok: false as const, error: 'Empresa não encontrada' }

    if (session.user.role !== 'ADMIN' && session.user.companySlug && session.user.companySlug !== companySlug) {
      return { ok: false as const, error: 'Acesso negado' }
    }

    const project = await db.project.findUnique({
      where: { id: projectId, companyId: company.id, deletedAt: null },
    })
    if (!project) return { ok: false as const, error: 'Projeto não encontrado' }

    let authorName = ''
    if (authorId) {
      const user = await db.user.findUnique({ where: { id: authorId }, select: { name: true, email: true } })
      authorName = user?.name ?? user?.email ?? ''
    }

    const post = await db.blogPost.create({
      data: {
        ...rest,
        body: cleanBody,
        readingTime,
        slug: resolvedSlug,
        status,
        publishedAt,
        authorName,
        ...(authorId && { authorId }),
        projectId,
        categories: catIds.length > 0 ? { create: catIds.map((categoryId) => ({ categoryId })) } : undefined,
        tags: ids.length > 0 ? { create: ids.map((tagId) => ({ tagId })) } : undefined,
      },
    })
    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'BlogPost',
      entityId: post.id,
      entityLabel: post.title,
      projectId: post.projectId,
      newData: post,
    })

    revalidatePath(`/${companySlug}/dashboard`)
    revalidateSites(companySlug)
    return { ok: true as const, data: post }
  } catch {
    return { ok: false as const, error: 'Erro ao criar artigo' }
  }
}
