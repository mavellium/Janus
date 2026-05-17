import { db } from '@/lib/prisma'

export async function getDeveloperUsers(developerId: string, companyId: string) {
  return db.user.findMany({
    where: {
      deletedAt: null,
      createdById: developerId,
      company: { id: companyId },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
