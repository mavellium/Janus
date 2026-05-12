'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  companyId: z.string().uuid(),
})

export async function createUser(_prev: { ok: boolean; error?: string }, formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== 'DEVELOPER') return { ok: false, error: 'Acesso não autorizado.' }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    companyId: formData.get('companyId'),
  })

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { ok: false, error: 'E-mail já cadastrado.' }

  const company = await db.company.findUnique({ where: { id: parsed.data.companyId, deletedAt: null } })
  if (!company) return { ok: false, error: 'Empresa não encontrada.' }

  const passwordHash = await hash(parsed.data.password, 10)

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: passwordHash,
      companyId: parsed.data.companyId,
      role: 'DEFAULT',
      requiresPasswordReset: true,
      createdById: session.user.id,
    },
  })

  revalidatePath(`/dev/${session.user.id}/dashboard/users`)
  return { ok: true }
}
