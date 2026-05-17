'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
})

export async function editCompany(_prev: { ok: boolean; error?: string }, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DEVELOPER' && session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
  })

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const conflict = await db.company.findFirst({
    where: { slug: parsed.data.slug, id: { not: parsed.data.id } },
  })
  if (conflict) return { ok: false, error: 'Slug já está em uso.' }

  await db.company.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description ?? null },
  })

  revalidatePath(`/dev/${session.user.id}/dashboard/companies`)
  return { ok: true }
}
