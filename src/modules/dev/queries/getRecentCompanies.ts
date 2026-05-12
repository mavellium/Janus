import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getRecentCompanies(take = 3) {
  const session = await auth()
  return db.company.findMany({
    where: { deletedAt: null, createdById: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, name: true, slug: true, createdAt: true },
  })
}
