import { db } from '@/lib/prisma'

export async function getBlogCategories(projectId: string) {
  return db.blogCategory.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  })
}
