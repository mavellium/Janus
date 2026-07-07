'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sanitizeArticleHtml } from '@/lib/sanitize-html'
import { readingTimeFromHtml } from '@/lib/reading-time'

const schema = z.object({
  id: z.string().uuid(),
  companySlug: z.string(),
  projectId: z.string().uuid(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  body: z.string().default(''),
  coverImageUrl: z.string().nullable().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
})

export async function autosaveBlogPost(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    id: formData.get('id'),
    companySlug: formData.get('companySlug'),
    projectId: formData.get('projectId'),
    title: formData.get('title'),
    subtitle: formData.get('subtitle') || undefined,
    status: formData.get('status') || 'DRAFT',
    body: formData.get('body') || '',
    coverImageUrl: (formData.get('coverImageUrl') as string) || null,
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
  })
  if (!parsed.success) return { ok: false as const, error: 'Dados inválidos' }

  const { id, companySlug, projectId, ...rest } = parsed.data

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

  const existing = await db.blogPost.findUnique({
    where: { id, projectId },
    include: { project: true },
  })
  if (!existing || existing.project.companyId !== company.id) {
    return { ok: false as const, error: 'Artigo não encontrado' }
  }

  const cleanBody = sanitizeArticleHtml(rest.body)
  const readingTime = readingTimeFromHtml(cleanBody) || null
  const publishedAt =
    rest.status === 'PUBLISHED'
      ? (existing.publishedAt ?? new Date())
      : existing.publishedAt

  try {
    await db.blogPost.update({
      where: { id },
      data: {
        title: rest.title,
        subtitle: rest.subtitle ?? null,
        status: rest.status,
        body: cleanBody,
        readingTime,
        coverImageUrl: rest.coverImageUrl ?? null,
        seoTitle: rest.seoTitle ?? null,
        seoDescription: rest.seoDescription ?? null,
        seoKeywords: rest.seoKeywords ?? null,
        publishedAt,
      },
    })
    return { ok: true as const, savedAt: Date.now() }
  } catch {
    return { ok: false as const, error: 'Erro ao salvar' }
  }
}
