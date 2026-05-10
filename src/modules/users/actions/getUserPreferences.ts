'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'

export async function getUserPreferences(): Promise<UserPreferences> {
  const session = await auth()
  if (!session?.user?.id) {
    return {}
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true }
  })

  return (user?.preferences as UserPreferences) || {}
}
