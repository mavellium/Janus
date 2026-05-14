'use server'

import { db } from '@/lib/prisma'

export async function getDevStats(devId: string) {
  const companyFilter = { createdById: devId, deletedAt: null }

  const [totalCompanies, totalUsers, totalProjects] = await Promise.all([
    db.company.count({ where: companyFilter }),
    db.user.count({ where: { createdById: devId, deletedAt: null, role: 'DEFAULT' } }),
    db.project.count({ where: { deletedAt: null, company: companyFilter } }),
  ])

  return { totalCompanies, totalUsers, totalProjects }
}
