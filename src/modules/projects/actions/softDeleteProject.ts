'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

interface SoftDeleteProjectParams {
  projectId: string
  userName: string
  reason: string
  companySlug: string
}

export async function softDeleteProject({
  projectId,
  userName,
  reason,
  companySlug,
}: SoftDeleteProjectParams): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth()
    const before = await db.project.findUnique({ where: { id: projectId } })

    const updated = await db.project.update({
      where: { id: projectId },
      data: {
        isActive: false,
        deletedBy: userName,
        deletionReason: reason,
        deletedAt: new Date(),
      },
    })

    if (session?.user?.id && before) {
      await logAudit({
        userId: session.user.id,
        action: 'DELETE',
        entity: 'Project',
        entityId: projectId,
        oldData: before,
        newData: updated,
      })
    }

    revalidatePath(`/${companySlug}/dashboard/sites`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages`)

    return { ok: true }
  } catch (error) {
    console.error('Erro ao inativar projeto:', error)
    return { ok: false, error: 'Erro ao inativar projeto' }
  }
}
