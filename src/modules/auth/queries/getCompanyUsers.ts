import { db } from '@/lib/prisma'

export async function getCompanyUsers(companyId: string) {
  return db.user.findMany({
    where: {
      deletedAt: null,
      company: { id: companyId },
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
