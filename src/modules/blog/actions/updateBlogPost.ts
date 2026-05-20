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
  publishedAt: z.string(),
  body: z.string().default(''),
  coverImageUrl: z.string().optional(),
  authorName: z.string().min(1),
  readingTime: z.coerce.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
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

  const parsed = schema.safeParse({
    id: formData.get('id'),
    companySlug: formData.get('companySlug'),
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    slug: formData.get('slug') || undefined,
    subtitle: formData.get('subtitle') || undefined,
    publishedAt: formData.get('publishedAt'),
    body: formData.get('body') || '',
    coverImageUrl: formData.get('coverImageUrl') || undefined,
    authorName: formData.get('authorName'),
    readingTime: formData.get('readingTime') || undefined,
    categoryId: formData.get('categoryId') || undefined,
    tagIds,
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
  })
  if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }

  const { id, tagIds: ids, categoryId, companySlug, projectId, slug, ...rest } = parsed.data
  const resolvedSlug = slug ? slugify(slug) : slugify(rest.title)

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
    })

    if (!company) return { ok: false as const, error: 'Empresa não encontrada' }

    if (session.user.role !== 'ADMIN' && session.user.companySlug && session.user.companySlug !== companySlug) {
      return { ok: false as const, error: 'Acesso negado' }
    }

    const post = await db.blogPost.findUnique({
      where: { id, projectId },
      include: { project: true },
    })

    if (!post || post.project.companyId !== company.id) {
      return { ok: false as const, error: 'Artigo não encontrado' }
    }

    const updated = await db.blogPost.update({
      where: { id },
      data: {
        ...rest,
        slug: resolvedSlug,
        publishedAt: new Date(rest.publishedAt),
        categoryId: categoryId ?? null,
        tags: {
          deleteMany: {},
          create: ids.map(tagId => ({ tagId })),
        },
      },
    })
    revalidatePath(`/${companySlug}/dashboard`)
    revalidateSites()
    return { ok: true as const, data: updated }
  } catch {
    return { ok: false as const, error: 'Erro ao atualizar artigo' }
  }
}
