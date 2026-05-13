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
})

export async function updateBlogCategory(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
  })
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  const { id, name, description, imageUrl } = parsed.data
  const slug = generateSlug(name)

  try {
    const category = await db.blogCategory.update({
      where: { id },
      data: { name, description, imageUrl, slug },
    })
    revalidatePath('/', 'layout')
    return { ok: true, data: category }
  } catch {
    return { ok: false, error: 'Erro ao atualizar categoria' }
  }
}
