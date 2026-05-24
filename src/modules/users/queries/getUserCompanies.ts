'use server'

import { db } from '@/lib/prisma'

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

  // empresa primária primeiro
  if (user.company && !user.company.deletedAt) {
    seen.add(user.company.id)
    result.push({ companyId: user.company.id, name: user.company.name, slug: user.company.slug, permissions: [] })
  }

  for (const link of user.companies) {
    if (!link.company.deletedAt && !seen.has(link.company.id)) {
      seen.add(link.company.id)
      result.push({ companyId: link.company.id, name: link.company.name, slug: link.company.slug, permissions: link.permissions })
    }
  }

  return result
}
