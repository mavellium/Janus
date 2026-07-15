'use server'

import { db } from '@/lib/prisma'

const FALLBACK_COMPANY_SLUG = 'default'

export async function getUserCompanies(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      companyId: true,
      company: { select: { id: true, name: true, slug: true, deletedAt: true } },
      companies: {
        include: {
          company: { select: { id: true, name: true, slug: true, deletedAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!user) return []

  const seen = new Set<string>()
  const result: { companyId: string; name: string; slug: string; permissions: string[] }[] = []

  for (const link of user.companies) {
    if (
      !link.company.deletedAt &&
      link.company.slug !== FALLBACK_COMPANY_SLUG &&
      !seen.has(link.company.id)
    ) {
      seen.add(link.company.id)
      result.push({ companyId: link.company.id, name: link.company.name, slug: link.company.slug, permissions: link.permissions })
    }
  }

  if (
    result.length === 0 &&
    user.company &&
    !user.company.deletedAt &&
    user.company.slug !== FALLBACK_COMPANY_SLUG
  ) {
    result.push({ companyId: user.company.id, name: user.company.name, slug: user.company.slug, permissions: [] })
  }

  return result
}
