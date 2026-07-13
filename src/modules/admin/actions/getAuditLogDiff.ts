'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export interface AuditLogDiff {
  oldData: unknown
  newData: unknown
}

export async function getAuditLogDiff(
  logId: string,
): Promise<
  { ok: true; data: AuditLogDiff } | { ok: false; error: string }
> {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const log = await db.auditLog.findUnique({
    where: { id: logId },
    select: { oldData: true, newData: true },
  })

  if (!log) {
    return { ok: false, error: 'Registro de auditoria não encontrado.' }
  }

  return { ok: true, data: { oldData: log.oldData, newData: log.newData } }
}
