'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

interface UpdatePageParams {
  pageId: string
  name: string
  slug: string
  projectId: string
  previewUrl?: string
}

export async function updatePage({
  pageId,
  name,
  slug,
  projectId,
  previewUrl,
}: UpdatePageParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  if (session.user.role !== 'DEVELOPER' && session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Apenas desenvolvedores podem editar a estrutura de páginas' }
  }

  try {
    const page = await db.page.findUnique({
      where: { id: pageId },
      include: { project: { include: { company: true } } },
    })

    if (!page) {
      return { ok: false, error: 'Página não encontrada' }
    }

    if (session.user.role === 'DEVELOPER' && session.user.companySlug && page.project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    const updated = await db.page.update({
      where: { id: pageId },
      data: { name, slug, previewUrl: previewUrl || null },
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Page',
      entityId: pageId,
      entityLabel: `${updated.name} · ${page.project.name}`,
      companyId: page.project.companyId,
      projectId: page.project.id,
      oldData: { ...page, project: undefined },
      newData: updated,
    })

    const basePath = page.project.type === 'LANDING_PAGE'
      ? `/${page.project.company.slug}/dashboard/landing-pages/${projectId}/pages`
      : `/${page.project.company.slug}/dashboard/sites/${projectId}/pages`

    revalidatePath(basePath)

    return { ok: true, data: updated }
  } catch (error) {
    console.error('[updatePage]', error)
    return { ok: false, error: 'Erro ao atualizar página' }
  }
}
