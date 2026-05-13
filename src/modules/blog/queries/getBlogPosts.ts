import { db } from '@/lib/prisma'

export async function getBlogPosts(projectId: string) {
  return db.blogPost.findMany({
    where: { projectId },
    orderBy: { publishedAt: 'desc' },
    include: {
      category: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })
}
