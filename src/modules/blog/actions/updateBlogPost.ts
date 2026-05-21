'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'

const schema = z.object({
  id: z.string().uuid(),
  companySlug: z.string(),
  projectId: z.string().uuid(),
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
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function updateBlogPost(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)
  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean)

  const parsed = schema.safeParse({
    id: formData.get('id'),
    companySlug: formData.get('companySlug'),
    projectId: formData.get('projectId'),
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
  })
  if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }

  const { id, tagIds: ids, categoryIds: catIds, companySlug, projectId, slug, authorId, status, ...rest } = parsed.data
  const resolvedSlug = slug ? slugify(slug) : slugify(rest.title)

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
    })
    if (!company) return { ok: false as const, error: 'Empresa não encontrada' }

    if (session.user.role !== 'ADMIN' && session.user.companySlug && session.user.companySlug !== companySlug) {
      return { ok: false as const, error: 'Acesso negado' }
    }

    const existing = await db.blogPost.findUnique({
      where: { id, projectId },
      include: { project: true },
    })
    if (!existing || existing.project.companyId !== company.id) {
      return { ok: false as const, error: 'Artigo não encontrado' }
    }

    const publishedAt =
      status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : existing.publishedAt

    let authorName = existing.authorName
    if (authorId) {
      const user = await db.user.findUnique({ where: { id: authorId }, select: { name: true, email: true } })
      authorName = user?.name ?? user?.email ?? existing.authorName
    }

    const updated = await db.blogPost.update({
      where: { id },
      data: {
        ...rest,
        slug: resolvedSlug,
        status,
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
    revalidatePath(`/${companySlug}/dashboard`)
    revalidateSites(companySlug)
    return { ok: true as const, data: updated }
  } catch {
    return { ok: false as const, error: 'Erro ao atualizar artigo' }
  }
}
