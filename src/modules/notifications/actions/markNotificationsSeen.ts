'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'

export async function markNotificationsSeen(): Promise<
  { ok: true; data: null } | { ok: false; error: string; code?: number }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autorizado', code: 401 }
  }

  const row = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  })

  const current = (row?.preferences ?? {}) as UserPreferences
  const merged = {
    ...current,
    notifications_last_seen_at: new Date().toISOString(),
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: merged },
  })

  return { ok: true, data: null }
}
