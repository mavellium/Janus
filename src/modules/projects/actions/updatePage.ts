'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface UpdatePageParams {
  pageId: string
  name: string
  slug: string
  projectId: string
}

export async function updatePage({
  pageId,
  name,
  slug,
  projectId,
}: UpdatePageParams) {
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
      data: { name, slug },
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
