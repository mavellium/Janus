import { db } from '@/lib/prisma'

export async function getBlogPostVersions(postId: string, limit = 30) {
  return db.blogPostVersion.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      readingTime: true,
      createdByName: true,
      createdAt: true,
    },
  })
}

export type BlogPostVersionItem = Awaited<
  ReturnType<typeof getBlogPostVersions>
>[number]
