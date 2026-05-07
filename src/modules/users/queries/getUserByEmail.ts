import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'

export interface UserRow {
  id: string
  email: string
  password: string
  role: string
  image: string | null
  preferences: UserPreferences
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  return db.user.findFirst({
    where: { email: email.trim().toLowerCase(), deletedAt: null },
    select: { id: true, email: true, password: true, role: true, image: true, preferences: true },
  }) as Promise<UserRow | null>
}
