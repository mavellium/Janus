import type { PlanTier, SubscriptionStatus } from '@/generated/prisma/client'
import {
  PLAN_CATALOG,
  POST_TRIAL_DISCOUNT_MONTHS,
  POST_TRIAL_DISCOUNT_PERCENT,
  TRIAL_DAYS,
  type PlanLimits,
} from './plans'

export interface SubscriptionSnapshot {
  tier: PlanTier
  status: SubscriptionStatus
  trialEndsAt: Date | null
  discountPercent: number | null
  discountEndsAt: Date | null
  limitOverrides: unknown
}

export interface EffectiveSubscription {
  tier: PlanTier
  status: SubscriptionStatus
  effectiveStatus: SubscriptionStatus
  limits: PlanLimits
  planLimits: PlanLimits
  overrides: Partial<PlanLimits>
  locked: boolean
  trialEndsAt: Date | null
  trialDaysLeft: number | null
  discountPercent: number | null
  discountEndsAt: Date | null
  discountActive: boolean
}

const NUMERIC_KEYS = [
  'projects',
  'users',
  'seoAnalysesPerDay',
  'siteScansPerDay',
  'geoRunsPerMonth',
  'historyDays',
] as const satisfies readonly (keyof PlanLimits)[]

const BOOLEAN_KEYS = [
  'blogScheduling',
  'scripts',
  'prioritySupport',
] as const satisfies readonly (keyof PlanLimits)[]

const LOCKED_STATUSES: SubscriptionStatus[] = ['EXPIRED', 'CANCELED']

export function parseLimitOverrides(raw: unknown): Partial<PlanLimits> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const source = raw as Record<string, unknown>
  const overrides: Partial<PlanLimits> = {}

  for (const key of NUMERIC_KEYS) {
    if (!(key in source)) continue
    const value = source[key]
    if (value === null) {
      overrides[key] = null
      continue
    }
    if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
      overrides[key] = value
    }
  }

  for (const key of BOOLEAN_KEYS) {
    if (!(key in source)) continue
    if (typeof source[key] === 'boolean') {
      overrides[key] = source[key] as boolean
    }
  }

  return overrides
}

export function trialDaysLeft(trialEndsAt: Date | null, now: Date): number | null {
  if (!trialEndsAt) return null
  const ms = trialEndsAt.getTime() - now.getTime()
  if (ms <= 0) return 0
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

/**
 * Assinatura em TRIALING cujo `trialEndsAt` já passou é tratada como EXPIRED sem depender de
 * job de cobrança: a leitura é sempre feita a partir do relógio, não de um estado gravado que
 * pode ficar velho.
 */
export function resolveEffectiveStatus(
  snapshot: Pick<SubscriptionSnapshot, 'status' | 'trialEndsAt'>,
  now: Date,
): SubscriptionStatus {
  if (
    snapshot.status === 'TRIALING' &&
    snapshot.trialEndsAt &&
    snapshot.trialEndsAt.getTime() <= now.getTime()
  ) {
    return 'EXPIRED'
  }
  return snapshot.status
}

function lockLimits(limits: PlanLimits): PlanLimits {
  return {
    ...limits,
    projects: 0,
    users: 0,
    seoAnalysesPerDay: 0,
    siteScansPerDay: 0,
    geoRunsPerMonth: 0,
    blogScheduling: false,
    scripts: false,
  }
}

export function resolveSubscription(
  snapshot: SubscriptionSnapshot,
  now: Date = new Date(),
): EffectiveSubscription {
  const planLimits = PLAN_CATALOG[snapshot.tier].limits
  const overrides = parseLimitOverrides(snapshot.limitOverrides)
  const effectiveStatus = resolveEffectiveStatus(snapshot, now)
  const locked = LOCKED_STATUSES.includes(effectiveStatus)

  const merged: PlanLimits = { ...planLimits, ...overrides }

  const discountActive =
    snapshot.discountPercent !== null &&
    snapshot.discountPercent > 0 &&
    (!snapshot.discountEndsAt || snapshot.discountEndsAt.getTime() > now.getTime())

  return {
    tier: snapshot.tier,
    status: snapshot.status,
    effectiveStatus,
    limits: locked ? lockLimits(merged) : merged,
    planLimits,
    overrides,
    locked,
    trialEndsAt: snapshot.trialEndsAt,
    trialDaysLeft: trialDaysLeft(snapshot.trialEndsAt, now),
    discountPercent: snapshot.discountPercent,
    discountEndsAt: snapshot.discountEndsAt,
    discountActive,
  }
}

export function trialEndDate(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Payload de assinatura para `company.create({ data: { subscription: { create: ... } } })`.
 * Toda empresa nasce no teste grátis; o admin promove para um plano pago depois.
 */
export function initialSubscriptionData(from: Date = new Date()) {
  return {
    tier: 'TRIAL',
    status: 'TRIALING',
    trialEndsAt: trialEndDate(from),
  } as const
}

export function postTrialDiscountEnd(from: Date = new Date()): Date {
  const end = new Date(from)
  end.setMonth(end.getMonth() + POST_TRIAL_DISCOUNT_MONTHS)
  return end
}

export const POST_TRIAL_DISCOUNT = {
  percent: POST_TRIAL_DISCOUNT_PERCENT,
  months: POST_TRIAL_DISCOUNT_MONTHS,
} as const
