import type { PlanTier, SubscriptionStatus } from '@/generated/prisma/client'
import type { CompanyUsage } from '@/modules/billing/queries/getCompanyUsage'
import type { PlanLimits } from '@/modules/billing/domain/plans'

export const PLAN_TIERS: PlanTier[] = ['TRIAL', 'INICIAL', 'MEDIO', 'PRO', 'ENTERPRISE']

export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
]

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Em teste',
  ACTIVE: 'Ativo',
  PAST_DUE: 'Atrasado',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
}

export const STATUS_STYLE: Record<SubscriptionStatus, string> = {
  TRIALING: 'bg-blue-500/10 text-blue-500',
  ACTIVE: 'bg-emerald-500/10 text-emerald-500',
  PAST_DUE: 'bg-yellow-500/10 text-yellow-600',
  CANCELED: 'bg-brand-btn-light text-brand-muted',
  EXPIRED: 'bg-destructive/10 text-destructive',
}

export const NUMERIC_LIMIT_KEYS = [
  'projects',
  'users',
  'seoAnalysesPerDay',
  'siteScansPerDay',
  'geoRunsPerMonth',
  'historyDays',
] as const satisfies readonly (keyof PlanLimits)[]

export const BOOLEAN_LIMIT_KEYS = [
  'blogScheduling',
  'scripts',
  'prioritySupport',
] as const satisfies readonly (keyof PlanLimits)[]

export const USAGE_BY_LIMIT: Record<
  (typeof NUMERIC_LIMIT_KEYS)[number],
  keyof CompanyUsage | null
> = {
  projects: 'projects',
  users: 'users',
  seoAnalysesPerDay: 'seoAnalysesToday',
  siteScansPerDay: 'siteScansToday',
  geoRunsPerMonth: 'geoRunsThisMonth',
  historyDays: null,
}

export function toDateInput(date: Date | null): string {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 10)
}

export function formatDateBr(date: Date | null): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}
