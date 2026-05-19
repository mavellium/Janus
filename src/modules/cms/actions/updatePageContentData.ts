'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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

    await db.page.update({
      where: { id: pageId },
      data: { contentData: safeData },
    })

    revalidatePath(`/${page.project.company.slug}/dashboard`, 'layout')

    return { ok: true }
  } catch (error) {
    console.error('[updatePageContentData]', error)
    return { ok: false, error: 'Erro ao salvar conteúdo' }
  }
}
