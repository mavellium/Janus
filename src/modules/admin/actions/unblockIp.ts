'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/audit-logger'

export const unblockIp = async (ip: string) => {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Unauthorized' }
  }

  if (!ip || typeof ip !== 'string') {
    return { ok: false, error: 'Invalid IP' }
  }

  try {
    const removed = await db.loginAttempt.deleteMany({
      where: { ip, success: false },
    })

    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'BlockedIp',
      entityId: ip,
      entityLabel: `IP desbloqueado · ${ip}`,
      oldData: { ip, removedAttempts: removed.count },
    })

    return { ok: true, data: { ip } }
  } catch {
    return { ok: false, error: 'Failed to unblock IP' }
  }
}
