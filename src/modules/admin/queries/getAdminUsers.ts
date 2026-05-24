import { db } from '@/lib/prisma'

export async function getAdminUsers() {
  const users = await db.user.findMany({
    where: { deletedAt: null, role: { in: ['DEFAULT', 'ADMIN'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      requiresPasswordReset: true,
      createdAt: true,
      companyId: true,
      company: { select: { id: true, name: true, slug: true } },
      companies: { select: { companyId: true } },
    },
  })

  return users.map((u) => ({
    ...u,
    linkedCompanyIds: u.companies.map((c) => c.companyId),
  }))
}
