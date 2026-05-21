'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
})

export async function createCompany(_prev: { ok: boolean; error?: string }, formData: FormData) {
  const session = await auth()

  if (session?.user?.role !== 'DEVELOPER' && session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const existing = await db.company.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) {
    return { ok: false, error: 'Slug já está em uso.' }
  }

  await db.company.create({ data: { ...parsed.data, createdById: session.user.id } })

  revalidatePath(`/dev/${session?.user?.id}/dashboard`)
  return { ok: true }
}
