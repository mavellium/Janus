'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function adminDeleteUser(id: string) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  await db.user.delete({ where: { id } })

  revalidatePath('/dashboard-admin/users')
  revalidatePath('/dashboard-admin/developers')
  return { ok: true }
}
