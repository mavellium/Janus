import { db } from '@/lib/prisma'
import { resolveSubscription, type EffectiveSubscription } from '../domain/limits'

const FALLBACK_TIER = 'INICIAL' as const

/**
 * Toda empresa recebe uma assinatura na criação e a migração fez o backfill das antigas.
 * O fallback existe só para não derrubar a operação de um cliente por causa de uma linha
 * ausente — nesse caso vale o piso pago (Inicial), nunca o bloqueio.
 */
export async function getCompanySubscription(
  companyId: string,
): Promise<EffectiveSubscription> {
  const subscription = await db.subscription.findUnique({
    where: { companyId },
    select: {
      tier: true,
      status: true,
      trialEndsAt: true,
      discountPercent: true,
      discountEndsAt: true,
      limitOverrides: true,
    },
  })

  if (!subscription) {
    console.warn(`[billing] Empresa ${companyId} sem assinatura; aplicando piso ${FALLBACK_TIER}.`)
    return resolveSubscription({
      tier: FALLBACK_TIER,
      status: 'ACTIVE',
      trialEndsAt: null,
      discountPercent: null,
      discountEndsAt: null,
      limitOverrides: {},
    })
  }

  return resolveSubscription(subscription)
}

export async function getCompanySubscriptionBySlug(
  companySlug: string,
): Promise<{ companyId: string; subscription: EffectiveSubscription } | null> {
  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) return null

  return {
    companyId: company.id,
    subscription: await getCompanySubscription(company.id),
  }
}
