import { db } from '@/lib/prisma'

export interface CompanyUsage {
  projects: number
  users: number
  seoAnalysesToday: number
  siteScansToday: number
  geoRunsThisMonth: number
}

export function startOfCurrentMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function last24h(now: Date = new Date()): Date {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000)
}

export async function getCompanyUsage(companyId: string): Promise<CompanyUsage> {
  const since = last24h()
  const monthStart = startOfCurrentMonth()

  const [projects, users, seoAnalysesToday, siteScansToday, geoRunsThisMonth] =
    await Promise.all([
      db.project.count({ where: { companyId, deletedAt: null, isActive: true } }),
      db.user.count({ where: { companyId, deletedAt: null } }),
      db.seoAnalysis.count({
        where: { companyId, projectId: null, createdAt: { gte: since } },
      }),
      db.seoAnalysis.count({
        where: { companyId, projectId: { not: null }, createdAt: { gte: since } },
      }),
      db.geoScoreSnapshot.count({
        where: { profile: { companyId }, createdAt: { gte: monthStart } },
      }),
    ])

  return { projects, users, seoAnalysesToday, siteScansToday, geoRunsThisMonth }
}
