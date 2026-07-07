import { db } from '@/lib/prisma'
import { auditRetentionCutoff } from '@/lib/audit-logger'

export const getAuditLogs = async (limit: number = 500) => {
  return await db.auditLog.findMany({
    where: { createdAt: { gte: auditRetentionCutoff() } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })
}

export type AuditLogWithUser = Awaited<ReturnType<typeof getAuditLogs>>[number]
