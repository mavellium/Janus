import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getAdminCompanies() {
  const session = await auth()
  return db.company.findMany({
    where: { deletedAt: null, createdById: session?.user?.id },
    include: {
      users: { where: { deletedAt: null }, select: { id: true } },
      projects: { where: { deletedAt: null }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
