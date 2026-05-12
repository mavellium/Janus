'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface UpdatePageContentDataParams {
  pageId: string
  contentData: object
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

    if (page.project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    const updated = await db.page.update({
      where: { id: pageId },
      data: { contentData },
    })

    return { ok: true, data: updated }
  } catch (error) {
    console.error('[updatePageContentData]', error)
    return { ok: false, error: 'Erro ao salvar conteúdo' }
  }
}
