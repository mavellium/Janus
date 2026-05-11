'use server'

import { db } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
    await db.project.update({
      where: { id: projectId },
      data: {
        isActive: false,
        deletedBy: userName,
        deletionReason: reason,
        deletedAt: new Date(),
      },
    })

    revalidatePath(`/${companySlug}/dashboard/sites`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages`)

    return { ok: true }
  } catch (error) {
    console.error('Erro ao inativar projeto:', error)
    return { ok: false, error: 'Erro ao inativar projeto' }
  }
}
