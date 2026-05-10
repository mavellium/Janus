import { db } from '@/lib/prisma'

export async function getPagesByProjectId(projectId: string) {
  return db.page.findMany({
    where: {
      projectId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })
}
