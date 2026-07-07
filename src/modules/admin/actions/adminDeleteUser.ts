'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit, omitSensitive } from '@/lib/audit-logger'

export async function adminDeleteUser(id: string) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const before = await db.user.findUnique({ where: { id } })

  await db.user.delete({ where: { id } })

  if (before) {
    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      oldData: omitSensitive(before),
    })
  }

  revalidatePath('/dashboard-admin/users')
  revalidatePath('/dashboard-admin/developers')
  return { ok: true }
}
