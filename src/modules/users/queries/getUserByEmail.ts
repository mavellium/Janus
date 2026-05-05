import { db } from '@/lib/prisma'

export interface UserRow {
  id: string
  email: string
  password: string
  role: string
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  return db.user.findFirst({
    where: { email: email.trim().toLowerCase(), deletedAt: null },
    select: { id: true, email: true, password: true, role: true },
  }) as Promise<UserRow | null>
}
