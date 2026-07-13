import { cookies } from 'next/headers'
import { db } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import {
  IMPERSONATED_USER_ID_COOKIE,
  IMPERSONATED_USER_NAME_COOKIE,
} from '@/lib/auth/permissions'

export const AUDIT_RETENTION_DAYS = 60

export function auditRetentionCutoff(): Date {
  return new Date(Date.now() - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'

export interface LogAuditParams {
  userId: string | null
  userEmail?: string | null
  userName?: string | null
  action: AuditActionType
  entity: string
  entityId: string
  entityLabel?: string | null
  companyId?: string | null
  projectId?: string | null
  oldData?: unknown
  newData?: unknown
}

const SENSITIVE_KEY_PATTERN =
  /password|secret|token|api[_-]?key|credential|authorization|private[_-]?key/i

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub)
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) continue
      result[key] = scrub(entry)
    }
    return result
  }
  return value
}

export function omitSensitive<T extends Record<string, unknown>>(
  record: T | null | undefined,
): Partial<T> | null {
  if (!record || typeof record !== 'object') return null
  return scrub(record) as Partial<T>
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

async function resolveActor(
  params: LogAuditParams,
): Promise<{ email: string | null; name: string | null }> {
  if (
    !params.userId ||
    params.userEmail !== undefined ||
    params.userName !== undefined
  ) {
    return { email: params.userEmail ?? null, name: params.userName ?? null }
  }
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true },
  })
  return { email: user?.email ?? null, name: user?.name ?? null }
}

async function resolveImpersonation(): Promise<{
  id: string | null
  name: string | null
}> {
  try {
    const store = await cookies()
    return {
      id: store.get(IMPERSONATED_USER_ID_COOKIE)?.value ?? null,
      name: store.get(IMPERSONATED_USER_NAME_COOKIE)?.value ?? null,
    }
  } catch {
    return { id: null, name: null }
  }
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const [actor, impersonation] = await Promise.all([
      resolveActor(params),
      resolveImpersonation(),
    ])
    await db.auditLog.create({
      data: {
        userId: params.userId,
        userEmail: actor.email,
        userName: actor.name,
        impersonatedId: impersonation.id,
        impersonatedName: impersonation.name,
        companyId: params.companyId ?? null,
        projectId: params.projectId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityLabel: params.entityLabel ?? null,
        oldData: toJson(scrub(params.oldData)),
        newData: toJson(scrub(params.newData)),
      },
    })
  } catch (error) {
    console.error('[logAudit] Falha ao registrar auditoria:', error)
  }
}
