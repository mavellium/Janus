import { db } from '@/lib/prisma'

export async function getCompanyUsers(companyId: string) {
  return db.user.findMany({
    where: {
      deletedAt: null,
      role: { not: 'ADMIN' },
      OR: [
        { companyId },
        { companies: { some: { companyId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })
}
