import { db } from '@/lib/prisma'
import { auditRetentionCutoff } from '@/lib/audit-logger'

export const AUDIT_LIST_LIMIT = 1000

export const getAuditLogs = async (limit: number = AUDIT_LIST_LIMIT) => {
  const where = { createdAt: { gte: auditRetentionCutoff() } }

  const [logs, totalCount] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        entityLabel: true,
        userId: true,
        userEmail: true,
        userName: true,
        impersonatedId: true,
        impersonatedName: true,
        companyId: true,
        projectId: true,
        createdAt: true,
      },
    }),
    db.auditLog.count({ where }),
  ])

  return { logs, totalCount }
}

export type AuditLogListItem = Awaited<
  ReturnType<typeof getAuditLogs>
>['logs'][number]

export const getAuditCompanies = async () => {
  const rows = await db.auditLog.findMany({
    where: { companyId: { not: null } },
    distinct: ['companyId'],
    select: { companyId: true },
  })

  const ids = rows
    .map((row) => row.companyId)
    .filter((id): id is string => !!id)

  if (ids.length === 0) return []

  return db.company.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}
