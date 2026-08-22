import type { PlanTier } from '@/generated/prisma/client'

export const TRIAL_DAYS = 7
export const POST_TRIAL_DISCOUNT_PERCENT = 20
export const POST_TRIAL_DISCOUNT_MONTHS = 3

export const UNLIMITED = null

export interface PlanLimits {
  projects: number | null
  users: number | null
  seoAnalysesPerDay: number | null
  siteScansPerDay: number | null
  geoRunsPerMonth: number | null
  historyDays: number | null
  blogScheduling: boolean
  scripts: boolean
  prioritySupport: boolean
}

export type NumericLimitKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends number | null ? K : never
}[keyof PlanLimits]

export type BooleanLimitKey = {
  [K in keyof PlanLimits]: PlanLimits[K] extends boolean ? K : never
}[keyof PlanLimits]

export interface PlanDefinition {
  tier: PlanTier
  name: string
  priceMonthly: number | null
  description: string
  features: string[]
  limits: PlanLimits
  purchasable: boolean
  trial: boolean
  highlight: boolean
  cta: string
}

const INICIAL_LIMITS: PlanLimits = {
  projects: 1,
  users: 3,
  seoAnalysesPerDay: 20,
  siteScansPerDay: 10,
  geoRunsPerMonth: 0,
  historyDays: 7,
  blogScheduling: false,
  scripts: false,
  prioritySupport: false,
}

export const PLAN_CATALOG: Record<PlanTier, PlanDefinition> = {
  TRIAL: {
    tier: 'TRIAL',
    name: 'Teste grátis',
    priceMonthly: 0,
    description: `Avaliação de ${TRIAL_DAYS} dias com os limites do plano Inicial.`,
    features: [`${TRIAL_DAYS} dias com tudo do Inicial`, 'Sem cartão de crédito'],
    limits: INICIAL_LIMITS,
    purchasable: false,
    trial: true,
    highlight: false,
    cta: 'Começar teste grátis',
  },
  INICIAL: {
    tier: 'INICIAL',
    name: 'Inicial',
    priceMonthly: 97,
    description: 'Para quem está começando a organizar um site.',
    features: [
      '1 site ou landing page',
      'Editor de conteúdo (CMS)',
      'Nota de SEO por página',
      'Suporte por e-mail',
    ],
    limits: INICIAL_LIMITS,
    purchasable: true,
    trial: true,
    highlight: false,
    cta: 'Começar teste grátis',
  },
  MEDIO: {
    tier: 'MEDIO',
    name: 'Médio',
    priceMonthly: 197,
    description: 'Para quem já publica conteúdo com frequência.',
    features: [
      'Tudo do Inicial',
      'Até 3 sites ou landing pages',
      'Blog completo com agendamento',
      'Histórico de alterações (60 dias)',
      'Raio-X de visibilidade em IA — 1 execução/mês',
    ],
    limits: {
      projects: 3,
      users: 10,
      seoAnalysesPerDay: 40,
      siteScansPerDay: 20,
      geoRunsPerMonth: 1,
      historyDays: 60,
      blogScheduling: true,
      scripts: false,
      prioritySupport: false,
    },
    purchasable: true,
    trial: false,
    highlight: false,
    cta: 'Assinar agora',
  },
  PRO: {
    tier: 'PRO',
    name: 'Pro',
    priceMonthly: 397,
    description: 'Para times que cuidam de vários sites ao mesmo tempo.',
    features: [
      'Tudo do Médio',
      'Até 10 sites ou landing pages',
      'Usuários e permissões ilimitados',
      'Pixels e integrações (Meta, Google, WhatsApp)',
      'Raio-X de visibilidade em IA — 4 execuções/mês',
      'Suporte prioritário',
    ],
    limits: {
      projects: 10,
      users: UNLIMITED,
      seoAnalysesPerDay: 100,
      siteScansPerDay: 50,
      geoRunsPerMonth: 4,
      historyDays: 60,
      blogScheduling: true,
      scripts: true,
      prioritySupport: true,
    },
    purchasable: true,
    trial: false,
    highlight: true,
    cta: 'Assinar agora',
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthly: null,
    description: 'Para operações grandes, com necessidades sob medida.',
    features: [
      'Tudo do Pro',
      'Sites e landing pages ilimitados',
      'Raio-X de visibilidade em IA sob medida',
      'Gerente de conta dedicado',
      'SLA e onboarding assistido',
    ],
    limits: {
      projects: UNLIMITED,
      users: UNLIMITED,
      seoAnalysesPerDay: UNLIMITED,
      siteScansPerDay: UNLIMITED,
      geoRunsPerMonth: UNLIMITED,
      historyDays: 60,
      blogScheduling: true,
      scripts: true,
      prioritySupport: true,
    },
    purchasable: false,
    trial: false,
    highlight: false,
    cta: 'Falar com vendas',
  },
}

export const PUBLIC_PLANS: PlanDefinition[] = [
  PLAN_CATALOG.INICIAL,
  PLAN_CATALOG.MEDIO,
  PLAN_CATALOG.PRO,
  PLAN_CATALOG.ENTERPRISE,
]

export const PLAN_TIER_ORDER: PlanTier[] = ['TRIAL', 'INICIAL', 'MEDIO', 'PRO', 'ENTERPRISE']

export const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  projects: 'Sites e landing pages',
  users: 'Usuários',
  seoAnalysesPerDay: 'Análises de SEO por dia',
  siteScansPerDay: 'Varreduras de site por dia',
  geoRunsPerMonth: 'Execuções do Raio-X por mês',
  historyDays: 'Dias de histórico visível',
  blogScheduling: 'Agendamento de artigos',
  scripts: 'Pixels e integrações',
  prioritySupport: 'Suporte prioritário',
}

export function getPlan(tier: PlanTier): PlanDefinition {
  return PLAN_CATALOG[tier]
}

export function isUnlimited(value: number | null): value is null {
  return value === null
}

export function formatLimitValue(value: number | boolean | null): string {
  if (value === null) return 'Ilimitado'
  if (typeof value === 'boolean') return value ? 'Liberado' : 'Bloqueado'
  return String(value)
}

export function applyDiscount(priceMonthly: number, discountPercent: number): number {
  return Math.round(priceMonthly * (100 - discountPercent)) / 100
}
