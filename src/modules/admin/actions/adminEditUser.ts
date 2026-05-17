'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  companyId: z.string().uuid().optional(),
})

export async function adminEditUser(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const rawPassword = String(formData.get('password') ?? '')
  const companyId = formData.get('companyId')
  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    email: formData.get('email'),
    password: rawPassword.length > 0 ? rawPassword : undefined,
    companyId: companyId === null ? undefined : companyId,
  })

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const conflict = await db.user.findFirst({
    where: { email: parsed.data.email, id: { not: parsed.data.id } },
  })
  if (conflict) {
    return { ok: false, error: 'E-mail já está em uso.' }
  }

  const data: { name: string; email: string; password?: string; companyId?: string } = {
    name: parsed.data.name,
    email: parsed.data.email,
  }

  if (parsed.data.password) {
    data.password = await hash(parsed.data.password, 10)
  }

  if (parsed.data.companyId) {
    data.companyId = parsed.data.companyId
  }

  await db.user.update({ where: { id: parsed.data.id }, data })

  revalidatePath('/dashboard-admin/users')
  revalidatePath('/dashboard-admin/developers')
  return { ok: true }
}
