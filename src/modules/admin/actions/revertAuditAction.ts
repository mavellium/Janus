'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

interface RevertibleDelegate {
  findUnique(args: {
    where: { id: string }
  }): Promise<Record<string, unknown> | null>
  update(args: {
    where: { id: string }
    data: Record<string, unknown>
  }): Promise<Record<string, unknown>>
  create(args: {
    data: Record<string, unknown>
  }): Promise<Record<string, unknown>>
}

const ENTITY_DELEGATES: Record<string, RevertibleDelegate> = {
  User: db.user as unknown as RevertibleDelegate,
  Company: db.company as unknown as RevertibleDelegate,
  Project: db.project as unknown as RevertibleDelegate,
  Page: db.page as unknown as RevertibleDelegate,
  BlogPost: db.blogPost as unknown as RevertibleDelegate,
  BlogCategory: db.blogCategory as unknown as RevertibleDelegate,
  BlogTag: db.blogTag as unknown as RevertibleDelegate,
  SiteScript: db.siteScript as unknown as RevertibleDelegate,
  GuestEntry: db.guestEntry as unknown as RevertibleDelegate,
  GuestPost: db.guestPost as unknown as RevertibleDelegate,
}

const SNAPSHOT_ONLY_KEYS = new Set([
  'deletedProjectsCount',
  'affectedUsersCount',
  'deletedPostsCount',
])

const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/

const NON_WRITABLE_KEYS = new Set(['updatedAt'])

function coerce(value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE.test(value)) return new Date(value)
  return value
}

function prepareWriteData(
  raw: Record<string, unknown>,
  keepIdentity: boolean,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (NON_WRITABLE_KEYS.has(key)) continue
    if (SNAPSHOT_ONLY_KEYS.has(key)) continue
    if (!keepIdentity && (key === 'id' || key === 'createdAt')) continue
    if (value === undefined) continue
    result[key] = coerce(value)
  }
  return result
}

function mapRevertError(error: unknown): string {
  const code = (error as { code?: string })?.code
  if (code === 'P2002')
    return 'Não foi possível restaurar: já existe um registro com os mesmos dados únicos.'
  if (code === 'P2003')
    return 'Não foi possível restaurar: uma referência relacionada não existe mais.'
  if (code === 'P2025')
    return 'Não foi possível restaurar: registro de destino não encontrado.'
  if (code === 'P2011' || code === 'P2012')
    return 'Não foi possível restaurar: faltam campos obrigatórios no estado salvo.'
  console.error('[revertAuditAction]', error)
  return 'Erro ao reverter a ação. Os dados podem violar restrições atuais.'
}

export async function revertAuditAction(
  logId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const log = await db.auditLog.findUnique({ where: { id: logId } })
  if (!log) {
    return { ok: false, error: 'Registro de auditoria não encontrado.' }
  }

  if (log.action !== 'UPDATE' && log.action !== 'DELETE') {
    return {
      ok: false,
      error: 'Apenas ações de edição e exclusão podem ser desfeitas.',
    }
  }

  const delegate = ENTITY_DELEGATES[log.entity]
  if (!delegate) {
    return {
      ok: false,
      error: `A entidade "${log.entity}" não suporta reversão automática.`,
    }
  }

  if (!log.oldData || typeof log.oldData !== 'object') {
    return { ok: false, error: 'Não há estado anterior para restaurar.' }
  }

  const oldData = log.oldData as Record<string, unknown>

  try {
    const existing = await delegate.findUnique({
      where: { id: log.entityId },
    })

    let restored: Record<string, unknown>

    if (existing) {
      restored = await delegate.update({
        where: { id: log.entityId },
        data: prepareWriteData(oldData, false),
      })
    } else {
      restored = await delegate.create({
        data: prepareWriteData(oldData, true),
      })
    }

    await logAudit({
      userId: session.user.id,
      action: 'RESTORE',
      entity: log.entity,
      entityId: log.entityId,
      entityLabel: log.entityLabel,
      companyId: log.companyId,
      projectId: log.projectId,
      oldData: existing,
      newData: restored,
    })

    revalidatePath('/dashboard-admin/logs')
    return { ok: true }
  } catch (error) {
    return { ok: false, error: mapRevertError(error) }
  }
}
