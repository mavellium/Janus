'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { ALL_PERMISSIONS } from '@/lib/auth/permissions'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  companyId: z.string().uuid(),
  role: z.enum(['DEFAULT', 'ADMIN']),
})

export async function adminCreateUser(
  _prev: { ok: boolean; error?: string },
  formData: FormData
) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    companyId: formData.get('companyId'),
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return { ok: false, error: 'E-mail já está em uso.' }
  }

  const company = await db.company.findUnique({ where: { id: parsed.data.companyId } })
  if (!company) {
    return { ok: false, error: 'Empresa não encontrada.' }
  }

  const hashedPassword = await hash(parsed.data.password, 10)

  const permissions = parsed.data.role === 'ADMIN' ? ALL_PERMISSIONS : []

  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      companyId: parsed.data.companyId,
      role: parsed.data.role,
      permissions,
      requiresPasswordReset: true,
      createdById: session.user.id,
    },
  })

  revalidatePath('/dashboard-admin/users')
  return { ok: true }
}
