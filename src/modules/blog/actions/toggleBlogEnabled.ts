'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function toggleBlogEnabled(projectId: string, companySlug: string, enabled: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
    })

    if (!company) return { ok: false, error: 'Empresa não encontrada' }

    if (session.user.role !== 'ADMIN' && session.user.companySlug && session.user.companySlug !== companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    const project = await db.project.findUnique({
      where: { id: projectId, companyId: company.id, deletedAt: null },
    })

    if (!project) return { ok: false, error: 'Projeto não encontrado' }

    await db.project.update({
      where: { id: projectId },
      data: { blogEnabled: enabled },
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Project',
      entityId: projectId,
      entityLabel: `Blog ${enabled ? 'ativado' : 'desativado'} · ${project.name}`,
      companyId: company.id,
      projectId,
      oldData: { blogEnabled: project.blogEnabled },
      newData: { blogEnabled: enabled },
    })

    revalidatePath(`/${companySlug}/dashboard`)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao atualizar configuração' }
  }
}
