import { db } from '@/lib/prisma'

export async function getBlogPosts(projectId: string) {
  return db.blogPost.findMany({
    where: { projectId },
    orderBy: [{ publishedAt: { sort: 'asc', nulls: 'last' } }],
    include: {
      categories: { include: { category: { select: { id: true, name: true, parentId: true } } } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      author: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}
