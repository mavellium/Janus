'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function toggleGuestMode(companyId: string, enabled: boolean) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  const before = await db.company.findUnique({
    where: { id: companyId },
    select: { name: true, guestModeEnabled: true },
  })

  await db.company.update({
    where: { id: companyId },
    data: { guestModeEnabled: enabled },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'Company',
    entityId: companyId,
    entityLabel: `Modo convidado · ${before?.name ?? companyId}`,
    companyId,
    oldData: { guestModeEnabled: before?.guestModeEnabled },
    newData: { guestModeEnabled: enabled },
  })

  revalidatePath('/dashboard-admin/companies')
  return { ok: true }
}
