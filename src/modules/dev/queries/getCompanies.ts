import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getCompanies(devId?: string) {
  const session = await auth()

  const userId = devId ?? session?.user?.id

  if (!userId) return []

  return db.company.findMany({
    where: { deletedAt: null, createdById: userId },
    include: {
      users: {
        where: { deletedAt: null },
        select: { id: true },
      },
      projects: {
        where: { deletedAt: null },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
