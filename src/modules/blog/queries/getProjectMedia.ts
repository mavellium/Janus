import { db } from '@/lib/prisma'

export async function getProjectMedia(projectId: string, limit = 100) {
  return db.mediaAsset.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { id: true, url: true, fileName: true, createdAt: true },
  })
}

export type MediaAssetItem = Awaited<ReturnType<typeof getProjectMedia>>[number]
