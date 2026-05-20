import { db } from '@/lib/prisma'

export async function getBlogTags(projectId: string) {
  return db.blogTag.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } },
    },
  })
}
