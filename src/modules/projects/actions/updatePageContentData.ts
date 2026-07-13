'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'
import { logAudit } from '@/lib/audit-logger'

interface UpdatePageContentDataParams {
  pageId: string
  contentData: Record<string, unknown>
}

export async function updatePageContentData({ pageId, contentData }: UpdatePageContentDataParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  try {
    const page = await db.page.findUnique({
      where: { id: pageId },
      include: { project: { include: { company: true } } },
    })

    if (!page) {
      return { ok: false, error: 'Página não encontrada' }
    }

    if (
      session.user.companySlug &&
      page.project.company.slug !== session.user.companySlug &&
      session.user.role !== 'ADMIN'
    ) {
      return { ok: false, error: 'Acesso negado' }
    }

    const safeData = JSON.parse(JSON.stringify(contentData))

    const updated = await db.page.update({
      where: { id: pageId },
      data: { contentData: safeData },
    })

    const { project, ...before } = page
    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Page',
      entityId: pageId,
      entityLabel: `${page.name} · ${project.name}`,
      companyId: project.companyId,
      projectId: project.id,
      oldData: before,
      newData: updated,
    })

    revalidatePath(`/${page.project.company.slug}/dashboard`, 'layout')
    revalidateSites(page.project.company.slug)

    return { ok: true }
  } catch (error) {
    console.error('[updatePageContentData]', error)
    return { ok: false, error: 'Erro ao salvar conteúdo' }
  }
}
