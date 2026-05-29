'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidateSites } from '@/lib/revalidateSites'

interface TogglePagePublishParams {
  pageId: string
  isPublished: boolean
}

export async function togglePagePublish({ pageId, isPublished }: TogglePagePublishParams) {
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
      data: { isPublished },
    })

    revalidateSites(page.project.company.slug)

    return { ok: true, data: updated }
  } catch (error) {
    console.error('[togglePagePublish]', error)
    return { ok: false, error: 'Erro ao atualizar status de publicação' }
  }
}
