'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function adminDeleteCompany(id: string) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const before = await db.company.findUnique({
    where: { id },
    include: { _count: { select: { projects: true, users: true } } },
  })

  await db.company.delete({ where: { id } })

  if (before) {
    const { _count, ...snapshot } = before
    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'Company',
      entityId: id,
      entityLabel: before.name,
      companyId: id,
      oldData: {
        ...snapshot,
        deletedProjectsCount: _count.projects,
        affectedUsersCount: _count.users,
      },
    })
  }

  revalidatePath('/dashboard-admin/companies')
  return { ok: true }
}
