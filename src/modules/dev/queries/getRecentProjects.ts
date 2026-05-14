import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getRecentProjects(take = 5) {
  const session = await auth()
  return db.project.findMany({
    where: {
      deletedAt: null,
      company: { createdById: session?.user?.id, deletedAt: null },
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
