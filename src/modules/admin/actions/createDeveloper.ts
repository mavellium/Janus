'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { ALL_PERMISSIONS } from '@/lib/auth/permissions'
import { logAudit, omitSensitive } from '@/lib/audit-logger'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function createDeveloper(
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
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return { ok: false, error: 'E-mail já está em uso.' }
  }

  let defaultCompany = await db.company.findFirst({ where: { slug: 'default' } })
  if (!defaultCompany) {
    defaultCompany = await db.company.create({
      data: {
        slug: 'default',
        name: 'Default',
      },
    })
  }

  const hashedPassword = await hash(parsed.data.password, 10)

  const developer = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      companyId: defaultCompany.id,
      role: 'DEVELOPER',
      permissions: ALL_PERMISSIONS,
      requiresPasswordReset: true,
      createdById: session.user.id,
    },
  })

  await logAudit({
    userId: session.user.id,
    action: 'CREATE',
    entity: 'User',
    entityId: developer.id,
    entityLabel: `Desenvolvedor · ${developer.email}`,
    companyId: developer.companyId,
    newData: omitSensitive(developer),
  })

  revalidatePath('/dashboard-admin/developers')
  return { ok: true }
}
