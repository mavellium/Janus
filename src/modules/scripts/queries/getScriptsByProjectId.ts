import { db } from '@/lib/prisma'

export async function getScriptsByProjectId(projectId: string) {
  return db.siteScript.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      code: true,
      position: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export type SiteScriptRow = Awaited<ReturnType<typeof getScriptsByProjectId>>[number]
