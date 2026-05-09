import { db } from '@/lib/prisma'

interface GetProjectsParams {
  companyId: string
  type?: 'LANDING_PAGE' | 'INSTITUTIONAL'
}

export async function getProjects({ companyId, type }: GetProjectsParams) {
  return db.project.findMany({
    where: {
      companyId,
      deletedAt: null,
      ...(type && { type }),
    },
    include: {
      _count: {
        select: { pages: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}
