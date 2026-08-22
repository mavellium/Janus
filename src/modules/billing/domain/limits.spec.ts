import { describe, expect, it } from 'vitest'
import {
  parseLimitOverrides,
  resolveEffectiveStatus,
  resolveSubscription,
  trialDaysLeft,
  type SubscriptionSnapshot,
} from './limits'
import { PLAN_CATALOG } from './plans'

const NOW = new Date('2026-08-22T12:00:00.000Z')

function snapshot(overrides: Partial<SubscriptionSnapshot> = {}): SubscriptionSnapshot {
  return {
    tier: 'INICIAL',
    status: 'ACTIVE',
    trialEndsAt: null,
    discountPercent: null,
    discountEndsAt: null,
    limitOverrides: {},
    ...overrides,
  }
}

describe('parseLimitOverrides', () => {
  it('ignora valores inválidos e mantém apenas chaves conhecidas', () => {
    const result = parseLimitOverrides({
      projects: 5,
      users: -1,
      seoAnalysesPerDay: 'muitos',
      scripts: true,
      inexistente: 10,
    })

    expect(result).toEqual({ projects: 5, scripts: true })
  })

  it('aceita null como ilimitado', () => {
    expect(parseLimitOverrides({ projects: null })).toEqual({ projects: null })
  })

  it('devolve objeto vazio para entrada não-objeto', () => {
    expect(parseLimitOverrides(null)).toEqual({})
    expect(parseLimitOverrides([1, 2])).toEqual({})
  })
})

describe('resolveEffectiveStatus', () => {
  it('trata trial vencido como EXPIRED sem depender de job', () => {
    const status = resolveEffectiveStatus(
      { status: 'TRIALING', trialEndsAt: new Date('2026-08-20T00:00:00.000Z') },
      NOW,
    )
    expect(status).toBe('EXPIRED')
  })

  it('mantém TRIALING enquanto o teste está em curso', () => {
    const status = resolveEffectiveStatus(
      { status: 'TRIALING', trialEndsAt: new Date('2026-08-25T00:00:00.000Z') },
      NOW,
    )
    expect(status).toBe('TRIALING')
  })
})

describe('trialDaysLeft', () => {
  it('arredonda para cima e nunca devolve negativo', () => {
    expect(trialDaysLeft(new Date('2026-08-24T18:00:00.000Z'), NOW)).toBe(3)
    expect(trialDaysLeft(new Date('2026-08-01T00:00:00.000Z'), NOW)).toBe(0)
    expect(trialDaysLeft(null, NOW)).toBeNull()
  })
})

describe('resolveSubscription', () => {
  it('usa os limites do plano quando não há override', () => {
    const result = resolveSubscription(snapshot({ tier: 'MEDIO' }), NOW)
    expect(result.limits).toEqual(PLAN_CATALOG.MEDIO.limits)
    expect(result.locked).toBe(false)
  })

  it('override do admin vence o valor do plano', () => {
    const result = resolveSubscription(
      snapshot({ tier: 'INICIAL', limitOverrides: { projects: 25, scripts: true } }),
      NOW,
    )
    expect(result.limits.projects).toBe(25)
    expect(result.limits.scripts).toBe(true)
    expect(result.planLimits.projects).toBe(1)
  })

  it('zera cotas de criação quando a assinatura está travada', () => {
    const result = resolveSubscription(
      snapshot({ tier: 'PRO', status: 'CANCELED', limitOverrides: { projects: 50 } }),
      NOW,
    )
    expect(result.locked).toBe(true)
    expect(result.limits.projects).toBe(0)
    expect(result.limits.scripts).toBe(false)
  })

  it('trial vencido trava as cotas mesmo com status TRIALING gravado', () => {
    const result = resolveSubscription(
      snapshot({
        tier: 'TRIAL',
        status: 'TRIALING',
        trialEndsAt: new Date('2026-08-10T00:00:00.000Z'),
      }),
      NOW,
    )
    expect(result.effectiveStatus).toBe('EXPIRED')
    expect(result.limits.projects).toBe(0)
  })

  it('desconto expirado não conta como ativo', () => {
    const expired = resolveSubscription(
      snapshot({
        discountPercent: 20,
        discountEndsAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
      NOW,
    )
    expect(expired.discountActive).toBe(false)

    const active = resolveSubscription(
      snapshot({
        discountPercent: 20,
        discountEndsAt: new Date('2026-11-01T00:00:00.000Z'),
      }),
      NOW,
    )
    expect(active.discountActive).toBe(true)
  })
})
