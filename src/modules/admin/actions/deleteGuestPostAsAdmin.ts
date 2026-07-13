'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function deleteGuestPostAsAdmin(
  id: string,
  guestId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  const before = await db.guestPost.findUnique({
    where: { id },
    include: { guest: { select: { companyId: true } } },
  })

  await db.guestPost.delete({ where: { id } })

  if (before) {
    const { guest, ...snapshot } = before
    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'GuestPost',
      entityId: id,
      entityLabel: before.title ?? before.message.slice(0, 60),
      companyId: guest.companyId,
      oldData: snapshot,
    })
  }

  revalidatePath(`/dashboard-admin/guests/${guestId}/posts`)
  return { ok: true }
}
