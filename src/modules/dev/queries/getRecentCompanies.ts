import { db } from '@/lib/prisma'

export async function getRecentCompanies(devId: string, take = 3) {
  return db.company.findMany({
    where: { deletedAt: null, createdById: devId },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, name: true, slug: true, createdAt: true },
  })
}
