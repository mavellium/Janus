'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { logAudit, omitSensitive } from '@/lib/audit-logger'
import { requireAdmin } from './guard'

const ADMIN_GEO_PATH = '/dashboard-admin/geo'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value && value.trim().length > 0 ? value.trim() : null))

const aliasesSchema = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? '')
      .split(',')
      .map((alias) => alias.trim())
      .filter(Boolean),
  )

const NO_COMPANY = 'none'

const companyIdSchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim()
    return !trimmed || trimmed === NO_COMPANY ? null : trimmed
  })
  .refine((value) => value === null || z.string().uuid().safeParse(value).success, {
    message: 'Empresa inválida.',
  })

const profileFieldsSchema = z.object({
  name: z.string().min(2, 'Informe o nome da empresa analisada.').max(160),
  companyId: companyIdSchema,
  description: optionalText(2000),
  industry: optionalText(160),
  location: optionalText(160),
  website: optionalText(300),
  targetAudience: optionalText(1000),
  differentiators: optionalText(1000),
  aliases: aliasesSchema,
})

const updateSchema = profileFieldsSchema.extend({ id: z.string().uuid() })

type ActionResult = { ok: true; data?: unknown } | { ok: false; error: string; code?: number }

function readProfileFormData(formData: FormData) {
  return {
    name: formData.get('name'),
    companyId: formData.get('companyId') ?? undefined,
    description: formData.get('description') ?? undefined,
    industry: formData.get('industry') ?? undefined,
    location: formData.get('location') ?? undefined,
    website: formData.get('website') ?? undefined,
    targetAudience: formData.get('targetAudience') ?? undefined,
    differentiators: formData.get('differentiators') ?? undefined,
    aliases: formData.get('aliases') ?? undefined,
  }
}

export async function createGeoTargetProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = profileFieldsSchema.safeParse(readProfileFormData(formData))
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const profile = await db.geoTargetProfile.create({
    data: { ...parsed.data, createdById: guard.actor.userId },
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'CREATE',
    entity: 'GeoTargetProfile',
    entityId: profile.id,
    entityLabel: profile.name,
    newData: omitSensitive(profile),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true, data: { id: profile.id } }
}

export async function updateGeoTargetProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = updateSchema.safeParse({
    ...readProfileFormData(formData),
    id: formData.get('id'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const { id, companyId, ...data } = parsed.data
  const previous = await db.geoTargetProfile.findUnique({ where: { id } })
  if (!previous) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const profile = await db.geoTargetProfile.update({
    where: { id },
    data: formData.has('companyId') ? { ...data, companyId } : data,
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'UPDATE',
    entity: 'GeoTargetProfile',
    entityId: profile.id,
    entityLabel: profile.name,
    oldData: omitSensitive(previous),
    newData: omitSensitive(profile),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true }
}

export async function archiveGeoTargetProfile(id: string): Promise<ActionResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: 'Identificador inválido', code: 400 }
  }

  const previous = await db.geoTargetProfile.findUnique({ where: { id } })
  if (!previous) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const profile = await db.geoTargetProfile.update({
    where: { id },
    data: { archivedAt: new Date() },
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'DELETE',
    entity: 'GeoTargetProfile',
    entityId: profile.id,
    entityLabel: profile.name,
    oldData: omitSensitive(previous),
    newData: omitSensitive(profile),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true }
}
