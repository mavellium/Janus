import { db } from '@/lib/prisma'

export interface AuditStats {
  todayCount: number
  weekDeleteCount: number
  weekImpersonationCount: number
  topActor: { label: string; count: number } | null
}

export async function getAuditStats(): Promise<AuditStats> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [todayCount, weekDeleteCount, weekImpersonationCount, topActors] =
    await Promise.all([
      db.auditLog.count({ where: { createdAt: { gte: startOfDay } } }),
      db.auditLog.count({
        where: { action: 'DELETE', createdAt: { gte: sevenDaysAgo } },
      }),
      db.auditLog.count({
        where: { entity: 'Impersonation', createdAt: { gte: sevenDaysAgo } },
      }),
      db.auditLog.groupBy({
        by: ['userEmail'],
        where: { createdAt: { gte: sevenDaysAgo }, userEmail: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { userEmail: 'desc' } },
        take: 1,
      }),
    ])

  const top = topActors[0]

  return {
    todayCount,
    weekDeleteCount,
    weekImpersonationCount,
    topActor:
      top && top.userEmail
        ? { label: top.userEmail, count: top._count._all }
        : null,
  }
}
