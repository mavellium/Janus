import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getRecentUsers(take = 3) {
  const session = await auth()
  return db.user.findMany({
    where: { deletedAt: null, role: 'DEFAULT', createdById: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      company: { select: { name: true, slug: true } },
    },
  })
}
