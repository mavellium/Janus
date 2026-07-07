'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/slug'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().uuid().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function createBlogTag(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
    parentId: formData.get('parentId') || undefined,
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
    isActive: formData.get('isActive') !== 'false',
  })
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  const { projectId, name, description, imageUrl, parentId, seoTitle, seoDescription, seoKeywords, isActive } =
    parsed.data
  const slug = generateSlug(name)

  try {
    const tag = await db.blogTag.create({
      data: { projectId, name, description, imageUrl, slug, parentId, seoTitle, seoDescription, seoKeywords, isActive },
    })
    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'BlogTag',
      entityId: tag.id,
      newData: tag,
    })
    revalidatePath('/', 'layout')
    return { ok: true, data: tag }
  } catch {
    return { ok: false, error: 'Erro ao criar tag' }
  }
}
