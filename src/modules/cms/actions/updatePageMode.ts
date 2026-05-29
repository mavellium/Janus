'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'

interface UpdatePageModeParams {
  pageId: string
  isAdvanced: boolean
}

export async function updatePageMode({ pageId, isAdvanced }: UpdatePageModeParams) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const page = await db.page.findUnique({
      where: { id: pageId },
      include: { project: { include: { company: true } } },
    })

    if (!page) return { ok: false, error: 'Página não encontrada' }

    if (
      session.user.companySlug &&
      page.project.company.slug !== session.user.companySlug &&
      session.user.role !== 'ADMIN'
    ) {
      return { ok: false, error: 'Acesso negado' }
    }

    await db.page.update({
      where: { id: pageId },
      data: { isAdvanced },
    })

    revalidatePath(`/${page.project.company.slug}/dashboard`)
    revalidateSites(page.project.company.slug)

    return { ok: true }
  } catch (error) {
    console.error('[updatePageMode]', error)
    return { ok: false, error: 'Erro ao atualizar modo' }
  }
}
