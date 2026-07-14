import { db } from '@/lib/prisma'
import { auditRetentionCutoff } from '@/lib/audit-logger'
import type { AuditActionType } from '@/lib/audit-logger'

const RELEVANT_ENTITIES = ['Project', 'Page', 'BlogPost', 'BlogCategory', 'BlogTag']

export interface CompanyActivityEntry {
  id: string
  action: AuditActionType
  entity: string
  entityLabel: string | null
  actorName: string
  createdAt: Date
}

export async function getRecentCompanyActivity(
  companyId: string,
  limit = 8,
  userId?: string
): Promise<CompanyActivityEntry[]> {
  const logs = await db.auditLog.findMany({
    where: {
      companyId,
      impersonatedId: null,
      ...(userId ? { userId } : {}),
      entity: { in: RELEVANT_ENTITIES },
      createdAt: { gte: auditRetentionCutoff() },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      entity: true,
      entityLabel: true,
      userName: true,
      userEmail: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  })

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityLabel: log.entityLabel,
    actorName:
      log.user?.name ?? log.userName ?? log.user?.email ?? log.userEmail ?? 'Alguém da equipe',
    createdAt: log.createdAt,
  }))
}
