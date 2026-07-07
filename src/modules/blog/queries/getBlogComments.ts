import { db } from '@/lib/prisma'

export async function getBlogComments(postId: string) {
  return db.blogComment.findMany({
    where: { postId },
    orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      body: true,
      authorName: true,
      resolved: true,
      createdAt: true,
    },
  })
}

export type BlogCommentItem = Awaited<ReturnType<typeof getBlogComments>>[number]
