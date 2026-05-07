'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'

export async function updatePreferences(
  patch: Partial<UserPreferences>
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  const current = (session.user.preferences ?? {}) as UserPreferences
  const merged = { ...current, ...patch }

  await db.user.update({
    where: { id: session.user.id },
    data: { preferences: merged },
  })

  return { ok: true }
}
