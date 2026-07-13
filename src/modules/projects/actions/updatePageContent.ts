'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'
import { logAudit } from '@/lib/audit-logger'

interface UpdatePageContentParams {
  pageId: string
  content: unknown
  isPublished?: boolean
}

export async function updatePageContent({
  pageId,
  content,
  isPublished,
}: UpdatePageContentParams) {
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

    if (session.user.companySlug && page.project.company.slug !== session.user.companySlug && session.user.role !== 'ADMIN') {
      return { ok: false, error: 'Acesso negado' }
    }

    const updated = await db.page.update({
      where: { id: pageId },
      data: {
        content: content as object,
        ...(isPublished !== undefined && { isPublished }),
      },
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

    revalidatePath(`/${page.project.company.slug}/preview/${pageId}`)
    revalidateSites(page.project.company.slug)

    return { ok: true, data: updated }
  } catch (error) {
    console.error('[updatePageContent]', error)
    return { ok: false, error: 'Erro ao salvar página' }
  }
}
