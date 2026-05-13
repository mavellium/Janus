import { db } from '@/lib/prisma'

export async function getBlogTags(projectId: string) {
  return db.blogTag.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  })
}
