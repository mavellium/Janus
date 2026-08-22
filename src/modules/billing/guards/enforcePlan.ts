import { PLAN_CATALOG, type BooleanLimitKey, type NumericLimitKey } from '../domain/plans'
import { getCompanySubscription } from '../queries/getCompanySubscription'
import { getCompanyUsage } from '../queries/getCompanyUsage'
import type { EffectiveSubscription } from '../domain/limits'

export type PlanGuardResult =
  | { ok: true; subscription: EffectiveSubscription }
  | { ok: false; error: string; code: number; subscription: EffectiveSubscription }

type UsageKey = keyof Awaited<ReturnType<typeof getCompanyUsage>>

const QUOTA_USAGE_KEY: Record<NumericLimitKey, UsageKey | null> = {
  projects: 'projects',
  users: 'users',
  seoAnalysesPerDay: 'seoAnalysesToday',
  siteScansPerDay: 'siteScansToday',
  geoRunsPerMonth: 'geoRunsThisMonth',
  historyDays: null,
}

const QUOTA_MESSAGE: Record<NumericLimitKey, (limit: number) => string> = {
  projects: (limit) =>
    limit === 0
      ? 'Seu plano não permite criar sites ou landing pages. Reative a assinatura para continuar.'
      : `Seu plano permite ${limit} site(s) ou landing page(s). Faça upgrade para criar mais.`,
  users: (limit) =>
    limit === 0
      ? 'Seu plano não permite adicionar usuários no momento.'
      : `Seu plano permite ${limit} usuário(s). Faça upgrade para adicionar mais.`,
  seoAnalysesPerDay: (limit) =>
    limit === 0
      ? 'Seu plano não inclui análises de SEO.'
      : `Limite de ${limit} análises de SEO por dia atingido. Tente novamente amanhã ou faça upgrade.`,
  siteScansPerDay: (limit) =>
    limit === 0
      ? 'Seu plano não inclui varredura de site.'
      : `Limite de ${limit} varreduras de site por dia atingido. Tente novamente amanhã ou faça upgrade.`,
  geoRunsPerMonth: (limit) =>
    limit === 0
      ? 'Seu plano não inclui o Raio-X de visibilidade em IA. Faça upgrade para liberar.'
      : `Limite de ${limit} execução(ões) do Raio-X neste mês atingido. Faça upgrade para liberar mais.`,
  historyDays: () => 'Limite de histórico atingido.',
}

const FEATURE_MESSAGE: Record<BooleanLimitKey, string> = {
  blogScheduling:
    'Agendamento de artigos está disponível a partir do plano Médio. Faça upgrade para liberar.',
  scripts:
    'Pixels e integrações estão disponíveis a partir do plano Pro. Faça upgrade para liberar.',
  prioritySupport: 'Suporte prioritário está disponível a partir do plano Pro.',
}

/**
 * Valida uma cota numérica do plano antes de uma mutação. `additional` permite reservar mais de
 * uma unidade de uma vez. Limite `null` significa ilimitado e sempre passa; a checagem de uso só
 * vai ao banco quando existe teto, para não pagar COUNT em plano Enterprise.
 */
export async function enforceQuota(
  companyId: string,
  key: NumericLimitKey,
  additional = 1,
): Promise<PlanGuardResult> {
  const subscription = await getCompanySubscription(companyId)
  const limit = subscription.limits[key]

  if (limit === null) return { ok: true, subscription }

  const usageKey = QUOTA_USAGE_KEY[key]
  if (!usageKey) return { ok: true, subscription }

  const usage = await getCompanyUsage(companyId)
  if (usage[usageKey] + additional > limit) {
    return {
      ok: false,
      error: QUOTA_MESSAGE[key](limit),
      // Teto zero é recurso que o plano não inclui (exige upgrade), não excesso de uso.
      code: limit === 0 || subscription.locked ? 402 : 429,
      subscription,
    }
  }

  return { ok: true, subscription }
}

export async function enforceFeature(
  companyId: string,
  key: BooleanLimitKey,
): Promise<PlanGuardResult> {
  const subscription = await getCompanySubscription(companyId)

  if (subscription.limits[key]) return { ok: true, subscription }

  return {
    ok: false,
    error: subscription.locked
      ? 'Assinatura inativa. Reative o plano para usar este recurso.'
      : FEATURE_MESSAGE[key],
    code: 402,
    subscription,
  }
}

export function requiredTierFor(key: BooleanLimitKey): string | null {
  for (const tier of ['INICIAL', 'MEDIO', 'PRO', 'ENTERPRISE'] as const) {
    if (PLAN_CATALOG[tier].limits[key]) return PLAN_CATALOG[tier].name
  }
  return null
}
