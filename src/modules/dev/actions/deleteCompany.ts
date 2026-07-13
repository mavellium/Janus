'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function deleteCompany(companyId: string) {
  const session = await auth()
  if (session?.user?.role !== 'DEVELOPER' && session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const before = await db.company.findUnique({ where: { id: companyId } })

  const after = await db.company.update({
    where: { id: companyId },
    data: { deletedAt: new Date() },
  })

  await logAudit({
    userId: session.user.id,
    action: 'DELETE',
    entity: 'Company',
    entityId: companyId,
    entityLabel: before?.name ?? null,
    companyId,
    oldData: before,
    newData: after,
  })

  revalidatePath(`/dev/${session.user.id}/dashboard/companies`)
  return { ok: true }
}
