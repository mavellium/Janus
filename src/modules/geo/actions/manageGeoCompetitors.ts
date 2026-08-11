'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { logAudit, omitSensitive } from '@/lib/audit-logger'
import { requireAdmin } from './guard'

const ADMIN_GEO_PATH = '/dashboard-admin/geo'

const aliasesSchema = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean),
  )

const createSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(2, 'Informe o nome do concorrente.').max(120),
  aliases: aliasesSchema,
  website: z
    .string()
    .max(300)
    .optional()
    .transform((value) => (value ? value : null)),
})

type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string; code?: number }

export async function createGeoCompetitor(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = createSchema.safeParse({
    profileId: formData.get('profileId'),
    name: formData.get('name'),
    aliases: formData.get('aliases') ?? undefined,
    website: formData.get('website') ?? undefined,
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

  const competitor = await db.geoCompetitor.create({ data: parsed.data })

  await logAudit({
    userId: guard.actor.userId,
    action: 'CREATE',
    entity: 'GeoCompetitor',
    entityId: competitor.id,
    entityLabel: competitor.name,
    newData: omitSensitive(competitor),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true }
}

export async function deleteGeoCompetitor(id: string): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Identificador inválido', code: 400 }
  }

  const previous = await db.geoCompetitor.findUnique({ where: { id } })
  if (!previous) {
    return { ok: false, error: 'Concorrente não encontrado', code: 404 }
  }

  await db.geoCompetitor.delete({ where: { id } })

  await logAudit({
    userId: guard.actor.userId,
    action: 'DELETE',
    entity: 'GeoCompetitor',
    entityId: previous.id,
    entityLabel: previous.name,
    oldData: omitSensitive(previous),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true }
}
