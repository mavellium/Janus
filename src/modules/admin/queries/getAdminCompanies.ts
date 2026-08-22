import { db } from '@/lib/prisma'
import { resolveSubscription, type EffectiveSubscription } from '@/modules/billing/domain/limits'
import { getCompanyUsage, type CompanyUsage } from '@/modules/billing/queries/getCompanyUsage'

const FALLBACK_SNAPSHOT = {
  tier: 'INICIAL',
  status: 'ACTIVE',
  trialEndsAt: null,
  discountPercent: null,
  discountEndsAt: null,
  limitOverrides: {},
} as const

export interface AdminCompanyRow {
  id: string
  name: string
  slug: string
  description: string | null
  guestModeEnabled: boolean
  createdById: string | null
  createdAt: Date
  users: { id: string; name: string | null; email: string; role: string }[]
  projects: { id: string }[]
  subscription: EffectiveSubscription
  subscriptionNotes: string | null
  currentPeriodEnd: Date | null
  usage: CompanyUsage
}

export async function getAdminCompanies(): Promise<AdminCompanyRow[]> {
  const companies = await db.company.findMany({
    where: { deletedAt: null },
    include: {
      users: {
        where: { deletedAt: null },
        select: { id: true, name: true, email: true, role: true },
      },
      projects: { where: { deletedAt: null }, select: { id: true } },
      subscription: {
        select: {
          tier: true,
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          discountPercent: true,
          discountEndsAt: true,
          limitOverrides: true,
          notes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Promise.all(
    companies.map(async (company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      guestModeEnabled: company.guestModeEnabled,
      createdById: company.createdById,
      createdAt: company.createdAt,
      users: company.users,
      projects: company.projects,
      subscription: resolveSubscription(company.subscription ?? FALLBACK_SNAPSHOT),
      subscriptionNotes: company.subscription?.notes ?? null,
      currentPeriodEnd: company.subscription?.currentPeriodEnd ?? null,
      usage: await getCompanyUsage(company.id),
    })),
  )
}
