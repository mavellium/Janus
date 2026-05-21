import { db } from '@/lib/prisma'

export async function getCompanyUsers(companyId: string) {
  return db.user.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true, name: true, email: true, image: true },
    orderBy: { name: 'asc' },
  })
}
