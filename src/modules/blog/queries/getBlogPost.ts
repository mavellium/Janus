import { db } from '@/lib/prisma'

export async function getBlogPost(id: string) {
  return db.blogPost.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      tags: { include: { tag: { select: { id: true, name: true } } } },
    },
  })
}
