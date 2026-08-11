'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { logAudit, omitSensitive } from '@/lib/audit-logger'
import { requireAdmin } from './guard'

const ADMIN_GEO_PATH = '/dashboard-admin/geo'

const createSchema = z.object({
  profileId: z.string().uuid(),
  text: z.string().min(10, 'A pergunta deve ter ao menos 10 caracteres.').max(500),
  layer: z.enum(['DECISAO', 'AVALIACAO', 'PROBLEMA']),
  priority: z.coerce.number().int().min(0).max(100).default(0),
})

const updateSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(10).max(500),
  layer: z.enum(['DECISAO', 'AVALIACAO', 'PROBLEMA']),
  priority: z.coerce.number().int().min(0).max(100),
})

type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string; code?: number }

export async function createGeoQuestion(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = createSchema.safeParse({
    profileId: formData.get('profileId'),
    text: formData.get('text'),
    layer: formData.get('layer'),
    priority: formData.get('priority') ?? 0,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: parsed.data.profileId, archivedAt: null },
    select: { id: true },
  })
  if (!profile) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const question = await db.geoTargetQuestion.create({ data: parsed.data })

  await logAudit({
    userId: guard.actor.userId,
    action: 'CREATE',
    entity: 'GeoTargetQuestion',
    entityId: question.id,
    entityLabel: question.text,
    newData: omitSensitive(question),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true, data: { id: question.id } }
}

export async function updateGeoQuestion(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    text: formData.get('text'),
    layer: formData.get('layer'),
    priority: formData.get('priority') ?? 0,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const { id, ...data } = parsed.data
  const previous = await db.geoTargetQuestion.findUnique({ where: { id } })
  if (!previous) {
    return { ok: false, error: 'Pergunta não encontrada', code: 404 }
  }

  const question = await db.geoTargetQuestion.update({ where: { id }, data })

  await logAudit({
    userId: guard.actor.userId,
    action: 'UPDATE',
    entity: 'GeoTargetQuestion',
    entityId: question.id,
    entityLabel: question.text,
    oldData: omitSensitive(previous),
    newData: omitSensitive(question),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true }
}

export async function archiveGeoQuestion(id: string): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Identificador inválido', code: 400 }
  }

  const previous = await db.geoTargetQuestion.findUnique({ where: { id } })
  if (!previous) {
    return { ok: false, error: 'Pergunta não encontrada', code: 404 }
  }

  const question = await db.geoTargetQuestion.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'DELETE',
    entity: 'GeoTargetQuestion',
    entityId: question.id,
    entityLabel: question.text,
    oldData: omitSensitive(previous),
    newData: omitSensitive(question),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true }
}
