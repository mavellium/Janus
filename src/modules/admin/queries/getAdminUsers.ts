import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getAdminUsers() {
  const session = await auth()
  return db.user.findMany({
    where: { deletedAt: null, role: { in: ['DEFAULT', 'ADMIN'] }, createdById: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      requiresPasswordReset: true,
      createdAt: true,
      company: { select: { id: true, name: true, slug: true } },
    },
  })
}
