'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function deleteGuestAsAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  const before = await db.guestEntry.findUnique({
    where: { id },
    include: { _count: { select: { posts: true } } },
  })

  await db.guestEntry.delete({ where: { id } })

  if (before) {
    const { _count, ...snapshot } = before
    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'GuestEntry',
      entityId: id,
      entityLabel: before.name,
      companyId: before.companyId,
      oldData: { ...snapshot, deletedPostsCount: _count.posts },
    })
  }

  revalidatePath('/dashboard-admin/guests')
  return { ok: true }
}
