'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sanitizeArticleHtml } from '@/lib/sanitize-html'
import { readingTimeFromHtml } from '@/lib/reading-time'

const schema = z.object({
  id: z.string().uuid().optional(),
  companySlug: z.string(),
  projectId: z.string().uuid(),
  title: z.string().default(''),
  subtitle: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  body: z.string().default(''),
  coverImageUrl: z.string().nullable().optional(),
  authorId: z.string().uuid().optional(),
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

async function resolveAuthorName(authorId?: string, fallback = ''): Promise<string> {
  if (!authorId) return fallback
  const user = await db.user.findUnique({ where: { id: authorId }, select: { name: true, email: true } })
  return user?.name ?? user?.email ?? fallback
}

export async function autosaveBlogPost(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    id: formData.get('id') || undefined,
    companySlug: formData.get('companySlug'),
    projectId: formData.get('projectId'),
    title: formData.get('title') || '',
    subtitle: formData.get('subtitle') || undefined,
    status: formData.get('status') || 'DRAFT',
    body: formData.get('body') || '',
    coverImageUrl: (formData.get('coverImageUrl') as string) || null,
    authorId: formData.get('authorId') || undefined,
    categoryIds: formData.getAll('categoryIds').map(String).filter(Boolean),
    tagIds: formData.getAll('tagIds').map(String).filter(Boolean),
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
    publishedAt: formData.get('publishedAt') || undefined,
  })
  if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }

  const {
    id,
    companySlug,
    projectId,
    categoryIds: catIds,
    tagIds: ids,
    authorId,
    status,
    publishedAt: publishedAtInput,
    ...rest
  } = parsed.data

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) return { ok: false as const, error: 'Empresa não encontrada' }
  if (
    session.user.role !== 'ADMIN' &&
    session.user.companySlug &&
    session.user.companySlug !== companySlug
  ) {
    return { ok: false as const, error: 'Acesso negado' }
  }

  const cleanBody = sanitizeArticleHtml(rest.body)
  const readingTime = readingTimeFromHtml(cleanBody) || null
  const scheduledAt = parsePublishedAt(publishedAtInput)
  const title = rest.title.trim() || 'Sem título'

  if (!id) {
    const project = await db.project.findUnique({
      where: { id: projectId, companyId: company.id, deletedAt: null },
    })
    if (!project) return { ok: false as const, error: 'Projeto não encontrado' }

    const authorName = await resolveAuthorName(authorId)
    const publishedAt = status === 'PUBLISHED' ? (scheduledAt ?? new Date()) : null
    const baseSlug = slugify(title) || 'sem-titulo'

    try {
      const created = await db.blogPost.create({
        data: {
          title,
          subtitle: rest.subtitle ?? null,
          status,
          body: cleanBody,
          readingTime,
          coverImageUrl: rest.coverImageUrl ?? null,
          seoTitle: rest.seoTitle ?? null,
          seoDescription: rest.seoDescription ?? null,
          seoKeywords: rest.seoKeywords ?? null,
          publishedAt,
          slug: `${baseSlug}-${Date.now().toString(36)}`,
          authorName,
          ...(authorId && { authorId }),
          projectId,
          categories: catIds.length > 0 ? { create: catIds.map((categoryId) => ({ categoryId })) } : undefined,
          tags: ids.length > 0 ? { create: ids.map((tagId) => ({ tagId })) } : undefined,
        },
      })
      return { ok: true as const, data: { id: created.id }, savedAt: Date.now() }
    } catch {
      return { ok: false as const, error: 'Erro ao salvar' }
    }
  }

  const existing = await db.blogPost.findUnique({
    where: { id, projectId },
    include: { project: true },
  })
  if (!existing || existing.project.companyId !== company.id) {
    return { ok: false as const, error: 'Artigo não encontrado' }
  }

  const publishedAt =
    status === 'PUBLISHED' ? (scheduledAt ?? existing.publishedAt ?? new Date()) : existing.publishedAt
  const authorName = await resolveAuthorName(authorId, existing.authorName)

  try {
    await db.blogPost.update({
      where: { id },
      data: {
        title,
        subtitle: rest.subtitle ?? null,
        status,
        body: cleanBody,
        readingTime,
        coverImageUrl: rest.coverImageUrl ?? null,
        seoTitle: rest.seoTitle ?? null,
        seoDescription: rest.seoDescription ?? null,
        seoKeywords: rest.seoKeywords ?? null,
        publishedAt,
        authorName,
        authorId: authorId ?? null,
        categories: {
          deleteMany: {},
          create: catIds.map((categoryId) => ({ categoryId })),
        },
        tags: {
          deleteMany: {},
          create: ids.map((tagId) => ({ tagId })),
        },
      },
    })
    return { ok: true as const, data: { id }, savedAt: Date.now() }
  } catch {
    return { ok: false as const, error: 'Erro ao salvar' }
  }
}
