import { db } from '@/lib/prisma'

interface GetProjectsParams {
  companyId: string
  type?: 'LANDING_PAGE' | 'INSTITUTIONAL'
}

export async function getProjects({ companyId, type }: GetProjectsParams) {
  return db.project.findMany({
    where: {
      companyId,
      isActive: true,
      deletedAt: null,
      ...(type && { type }),
    },
    select: {
      id: true,
      name: true,
      type: true,
      previewUrl: true,
      cmsSyncScriptUrl: true,
      cmsEnabled: true,
      blogEnabled: true,
      createdAt: true,
      _count: {
        select: { pages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
