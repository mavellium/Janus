import { db } from '@/lib/prisma'

export async function getBlogPost(id: string) {
  return db.blogPost.findUnique({
    where: { id },
    include: {
      categories: { include: { category: { select: { id: true, name: true, parentId: true } } } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
      author: { select: { id: true, name: true, email: true, image: true } },
    },
  })
}
