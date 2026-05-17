import { db } from '@/lib/prisma'

export async function getRecentProjects(devId: string, take = 5) {
  return db.project.findMany({
    where: {
      deletedAt: null,
      company: { createdById: devId, deletedAt: null },
    },
    orderBy: { updatedAt: 'desc' },
    take,
    select: {
      id: true,
      name: true,
      type: true,
      updatedAt: true,
      company: { select: { name: true, slug: true } },
    },
  })
}
