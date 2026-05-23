import { db } from '@/lib/prisma'

export async function getAdminCompanies() {
  return db.company.findMany({
    where: { deletedAt: null },
    include: {
      users: { where: { deletedAt: null }, select: { id: true, name: true, email: true, role: true } },
      projects: { where: { deletedAt: null }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
