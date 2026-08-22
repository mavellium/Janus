'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/audit-logger'
import { Prisma } from '@/generated/prisma/client'
import { initialSubscriptionData, parseLimitOverrides, postTrialDiscountEnd } from '../domain/limits'
import { POST_TRIAL_DISCOUNT_PERCENT, type PlanLimits } from '../domain/plans'

const ADMIN_COMPANIES_PATH = '/dashboard-admin/companies'

type ActionResult = { ok: true } | { ok: false; error: string; code?: number }

const tierSchema = z.enum(['TRIAL', 'INICIAL', 'MEDIO', 'PRO', 'ENTERPRISE'])
const statusSchema = z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED'])

const numericOverride = z
  .string()
  .optional()
  .transform((value) => (value === undefined || value.trim() === '' ? undefined : value.trim()))

const planSchema = z.object({
  companyId: z.string().uuid(),
  tier: tierSchema,
  status: statusSchema,
  trialEndsAt: z.string().optional(),
  currentPeriodEnd: z.string().optional(),
  discountPercent: z.string().optional(),
  discountEndsAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
})

const overridesSchema = z.object({
  companyId: z.string().uuid(),
  projects: numericOverride,
  users: numericOverride,
  seoAnalysesPerDay: numericOverride,
  siteScansPerDay: numericOverride,
  geoRunsPerMonth: numericOverride,
  historyDays: numericOverride,
  blogScheduling: z.string().optional(),
  scripts: z.string().optional(),
  prioritySupport: z.string().optional(),
})

const NUMERIC_OVERRIDE_KEYS = [
  'projects',
  'users',
  'seoAnalysesPerDay',
  'siteScansPerDay',
  'geoRunsPerMonth',
  'historyDays',
] as const

const BOOLEAN_OVERRIDE_KEYS = ['blogScheduling', 'scripts', 'prioritySupport'] as const

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  if (session.user.role !== 'ADMIN') return null
  return session.user
}

function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === '') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

async function ensureSubscription(companyId: string) {
  const existing = await db.subscription.findUnique({ where: { companyId } })
  if (existing) return existing
  return db.subscription.create({
    data: { companyId, ...initialSubscriptionData() },
  })
}

export async function adminUpdateSubscription(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Acesso não autorizado.', code: 403 }

  const parsed = planSchema.safeParse({
    companyId: formData.get('companyId'),
    tier: formData.get('tier'),
    status: formData.get('status'),
    trialEndsAt: formData.get('trialEndsAt') ?? undefined,
    currentPeriodEnd: formData.get('currentPeriodEnd') ?? undefined,
    discountPercent: formData.get('discountPercent') ?? undefined,
    discountEndsAt: formData.get('discountEndsAt') ?? undefined,
    notes: formData.get('notes') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const { companyId, tier, status, notes } = parsed.data

  const discountRaw = parsed.data.discountPercent?.trim()
  let discountPercent: number | null = null
  if (discountRaw) {
    const value = Number(discountRaw)
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return { ok: false, error: 'Desconto deve ser um inteiro entre 0 e 100.', code: 400 }
    }
    discountPercent = value === 0 ? null : value
  }

  const before = await ensureSubscription(companyId)

  const after = await db.subscription.update({
    where: { companyId },
    data: {
      tier,
      status,
      trialEndsAt: parseDate(parsed.data.trialEndsAt),
      currentPeriodEnd: parseDate(parsed.data.currentPeriodEnd),
      discountPercent,
      discountEndsAt: discountPercent === null ? null : parseDate(parsed.data.discountEndsAt),
      notes: notes?.trim() || null,
    },
  })

  await logAudit({
    userId: admin.id,
    action: 'UPDATE',
    entity: 'Subscription',
    entityId: after.id,
    entityLabel: `Plano ${after.tier}`,
    companyId,
    oldData: before,
    newData: after,
  })

  revalidatePath(ADMIN_COMPANIES_PATH)
  return { ok: true }
}

export async function adminUpdateLimitOverrides(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Acesso não autorizado.', code: 403 }

  const parsed = overridesSchema.safeParse({
    companyId: formData.get('companyId'),
    projects: formData.get('projects') ?? undefined,
    users: formData.get('users') ?? undefined,
    seoAnalysesPerDay: formData.get('seoAnalysesPerDay') ?? undefined,
    siteScansPerDay: formData.get('siteScansPerDay') ?? undefined,
    geoRunsPerMonth: formData.get('geoRunsPerMonth') ?? undefined,
    historyDays: formData.get('historyDays') ?? undefined,
    blogScheduling: formData.get('blogScheduling') ?? undefined,
    scripts: formData.get('scripts') ?? undefined,
    prioritySupport: formData.get('prioritySupport') ?? undefined,
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const overrides: Partial<PlanLimits> = {}

  for (const key of NUMERIC_OVERRIDE_KEYS) {
    const raw = parsed.data[key]
    if (raw === undefined) continue
    if (raw.toLowerCase() === 'ilimitado' || raw === '-1') {
      overrides[key] = null
      continue
    }
    const value = Number(raw)
    if (!Number.isInteger(value) || value < 0) {
      return {
        ok: false,
        error: `Valor inválido para "${key}". Use um inteiro ≥ 0 ou "ilimitado".`,
        code: 400,
      }
    }
    overrides[key] = value
  }

  for (const key of BOOLEAN_OVERRIDE_KEYS) {
    const raw = parsed.data[key]
    if (raw === undefined || raw === 'plano') continue
    overrides[key] = raw === 'on' || raw === 'true'
  }

  const { companyId } = parsed.data
  const before = await ensureSubscription(companyId)

  const after = await db.subscription.update({
    where: { companyId },
    data: { limitOverrides: overrides as Prisma.InputJsonValue },
  })

  await logAudit({
    userId: admin.id,
    action: 'UPDATE',
    entity: 'Subscription',
    entityId: after.id,
    entityLabel: 'Limites manuais',
    companyId,
    oldData: { limitOverrides: parseLimitOverrides(before.limitOverrides) },
    newData: { limitOverrides: overrides },
  })

  revalidatePath(ADMIN_COMPANIES_PATH)
  return { ok: true }
}

/**
 * Encerra o teste grátis e já aplica o desconto de boas-vindas: o cliente sai do trial
 * direto para o plano Inicial com o desconto vigente pelos próximos meses.
 */
export async function adminConvertTrial(companyId: string): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Acesso não autorizado.', code: 403 }

  if (!z.string().uuid().safeParse(companyId).success) {
    return { ok: false, error: 'Empresa inválida.', code: 400 }
  }

  const before = await ensureSubscription(companyId)

  const after = await db.subscription.update({
    where: { companyId },
    data: {
      tier: 'INICIAL',
      status: 'ACTIVE',
      trialEndsAt: null,
      discountPercent: POST_TRIAL_DISCOUNT_PERCENT,
      discountEndsAt: postTrialDiscountEnd(),
    },
  })

  await logAudit({
    userId: admin.id,
    action: 'UPDATE',
    entity: 'Subscription',
    entityId: after.id,
    entityLabel: 'Conversão de teste grátis',
    companyId,
    oldData: before,
    newData: after,
  })

  revalidatePath(ADMIN_COMPANIES_PATH)
  return { ok: true }
}

export async function adminExtendTrial(companyId: string, days: number): Promise<ActionResult> {
  const admin = await requireAdmin()
  if (!admin) return { ok: false, error: 'Acesso não autorizado.', code: 403 }

  if (!z.string().uuid().safeParse(companyId).success) {
    return { ok: false, error: 'Empresa inválida.', code: 400 }
  }
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    return { ok: false, error: 'Informe de 1 a 90 dias.', code: 400 }
  }

  const before = await ensureSubscription(companyId)
  const base =
    before.trialEndsAt && before.trialEndsAt.getTime() > Date.now()
      ? before.trialEndsAt
      : new Date()

  const after = await db.subscription.update({
    where: { companyId },
    data: {
      tier: before.tier === 'TRIAL' ? 'TRIAL' : before.tier,
      status: 'TRIALING',
      trialEndsAt: new Date(base.getTime() + days * 24 * 60 * 60 * 1000),
    },
  })

  await logAudit({
    userId: admin.id,
    action: 'UPDATE',
    entity: 'Subscription',
    entityId: after.id,
    entityLabel: `Teste estendido em ${days} dia(s)`,
    companyId,
    oldData: before,
    newData: after,
  })

  revalidatePath(ADMIN_COMPANIES_PATH)
  return { ok: true }
}
