'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function updateProjectBlogEnabled(projectId: string, blogEnabled: boolean) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'DEVELOPER') {
    return { ok: false as const, error: 'Acesso negado' }
  }

  try {
    const before = await db.project.findUnique({
      where: { id: projectId },
      select: { name: true, companyId: true, blogEnabled: true },
    })

    await db.project.update({
      where: { id: projectId },
      data: { blogEnabled },
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Project',
      entityId: projectId,
      entityLabel: `Blog ${blogEnabled ? 'ativado' : 'desativado'} · ${before?.name ?? projectId}`,
      companyId: before?.companyId,
      projectId,
      oldData: { blogEnabled: before?.blogEnabled },
      newData: { blogEnabled },
    })

    revalidatePath('/', 'layout')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Erro ao atualizar projeto' }
  }
}
