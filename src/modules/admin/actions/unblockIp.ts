'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const unblockIp = async (ip: string) => {
  const session = await auth()

  if (!session?.user || session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Unauthorized' }
  }

  if (!ip || typeof ip !== 'string') {
    return { ok: false, error: 'Invalid IP' }
  }

  try {
    await db.loginAttempt.deleteMany({
      where: { ip },
    })

    return { ok: true, data: { ip } }
  } catch (error) {
    return { ok: false, error: 'Failed to unblock IP' }
  }
}
