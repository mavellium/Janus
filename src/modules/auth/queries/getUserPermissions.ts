import { db } from '@/lib/prisma'

export async function getUserPermissions(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { permissions: true },
  })

  return user?.permissions ?? []
}
