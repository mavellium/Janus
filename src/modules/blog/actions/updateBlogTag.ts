'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateSlug } from '@/lib/slug'

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.string().uuid().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
})

export async function updateBlogTag(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
    parentId: formData.get('parentId') || undefined,
    seoTitle: formData.get('seoTitle') || undefined,
    seoDescription: formData.get('seoDescription') || undefined,
    seoKeywords: formData.get('seoKeywords') || undefined,
  })
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  const { id, name, description, imageUrl, parentId, seoTitle, seoDescription, seoKeywords } = parsed.data
  const slug = generateSlug(name)

  try {
    const tag = await db.blogTag.update({
      where: { id },
      data: { name, description, imageUrl, slug, parentId: parentId ?? null, seoTitle, seoDescription, seoKeywords },
    })
    revalidatePath('/', 'layout')
    return { ok: true, data: tag }
  } catch {
    return { ok: false, error: 'Erro ao atualizar tag' }
  }
}
