import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getUsers() {
  const session = await auth()
  return db.user.findMany({
    where: { deletedAt: null, createdById: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      company: { select: { id: true, name: true, slug: true } },
    },
  })
}
