import { db } from '@/lib/prisma'

export async function getUsers(devId: string) {
  return db.user.findMany({
    where: { deletedAt: null, createdById: devId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      company: { select: { id: true, name: true, slug: true } },
    },
  })
}
