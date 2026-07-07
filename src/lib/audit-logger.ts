import { db } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'

export const AUDIT_RETENTION_DAYS = 60

export function auditRetentionCutoff(): Date {
  return new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'

export interface LogAuditParams {
  userId: string
  action: AuditActionType
  entity: string
  entityId: string
  oldData?: unknown
  newData?: unknown
}

const SENSITIVE_KEYS = new Set(['password'])

export function omitSensitive<T extends Record<string, unknown>>(
  record: T | null | undefined,
): Partial<T> | null {
  if (!record || typeof record !== 'object') return null
  const clone: Record<string, unknown> = { ...record }
  for (const key of SENSITIVE_KEYS) delete clone[key]
  return clone as Partial<T>
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  } catch {
    return undefined
  }
}

export async function pruneAuditLogs(): Promise<void> {
  try {
    await db.auditLog.deleteMany({
      where: { createdAt: { lt: auditRetentionCutoff() } },
    })
  } catch (error) {
    console.error('[pruneAuditLogs] Falha ao limpar auditoria antiga:', error)
  }
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: toJson(params.oldData),
        newData: toJson(params.newData),
      },
    })
  } catch (error) {
    console.error('[logAudit] Falha ao registrar auditoria:', error)
  }
  await pruneAuditLogs()
}
