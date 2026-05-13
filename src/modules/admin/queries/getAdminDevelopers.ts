import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getAdminDevelopers() {
  const session = await auth()
  return db.user.findMany({
    where: { deletedAt: null, role: 'DEVELOPER', createdById: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      requiresPasswordReset: true,
      createdAt: true,
    },
  })
}
