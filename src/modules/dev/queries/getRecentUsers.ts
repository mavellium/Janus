import { db } from '@/lib/prisma'

export async function getRecentUsers(devId: string, take = 3) {
  return db.user.findMany({
    where: { deletedAt: null, role: 'DEFAULT', createdById: devId },
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
