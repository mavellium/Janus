import { db } from '@/lib/prisma'

export async function getAdminUsers() {
  return db.user.findMany({
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
      company: { select: { id: true, name: true, slug: true } },
    },
  })
}
