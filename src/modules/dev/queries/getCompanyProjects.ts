import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function getCompanyProjects(companyId: string) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'DEVELOPER') return []

  const company = await db.company.findUnique({
    where: { id: companyId, deletedAt: null },
    select: { id: true },
  })
  if (!company) return []

  return db.project.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, type: true, blogEnabled: true },
  })
}
