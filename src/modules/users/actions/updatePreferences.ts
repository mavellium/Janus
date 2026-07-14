'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getImpersonatedUserId } from '@/lib/auth/permissions'
import { revalidatePath } from 'next/cache'
import type { UserPreferences } from '@/types/next-auth'

export async function updatePreferences(
  patch: Partial<UserPreferences>
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  const impersonatedUserId = await getImpersonatedUserId()
  const targetUserId = impersonatedUserId ?? session.user.id

  const row = await db.user.findUnique({
    where: { id: targetUserId },
    select: { preferences: true },
  })

  const current = (row?.preferences ?? {}) as UserPreferences
  const merged = { ...current, ...patch }

  await db.user.update({
    where: { id: targetUserId },
    data: { preferences: merged },
  })

  revalidatePath(`/${session.user.companySlug}/dashboard`, 'layout')

  return { ok: true }
}
