import { db } from '@/lib/prisma'

export async function getBlogCategories(projectId: string) {
  return db.blogCategory.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
    },
  })
}
