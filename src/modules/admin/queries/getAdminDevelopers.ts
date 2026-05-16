import { db } from '@/lib/prisma'

export async function getAdminDevelopers() {
  return db.user.findMany({
    where: { deletedAt: null, role: 'DEVELOPER' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      requiresPasswordReset: true,
      createdAt: true,
    },
  })
}
