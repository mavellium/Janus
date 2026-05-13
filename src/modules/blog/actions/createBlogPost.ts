'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  publishedAt: z.string(),
  body: z.string().default(''),
  coverImageUrl: z.string().optional(),
  authorName: z.string().min(1),
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
})

export async function createBlogPost(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const tagIds = formData.getAll('tagIds').map(String).filter(Boolean)

  const parsed = schema.safeParse({
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    subtitle: formData.get('subtitle') || undefined,
    publishedAt: formData.get('publishedAt'),
    body: formData.get('body') || '',
    coverImageUrl: formData.get('coverImageUrl') || undefined,
    authorName: formData.get('authorName'),
    categoryId: formData.get('categoryId') || undefined,
    tagIds,
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
  })
  if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }

  const { tagIds: ids, categoryId, ...rest } = parsed.data

  try {
    const post = await db.blogPost.create({
      data: {
        ...rest,
        publishedAt: new Date(rest.publishedAt),
        ...(categoryId && { categoryId }),
        tags: ids.length > 0
          ? { create: ids.map(tagId => ({ tagId })) }
          : undefined,
      },
    })
    revalidatePath('/', 'layout')
    return { ok: true as const, data: post }
  } catch {
    return { ok: false as const, error: 'Erro ao criar artigo' }
  }
}
