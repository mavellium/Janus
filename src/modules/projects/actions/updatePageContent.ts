'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

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

    if (page.project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    const updated = await db.page.update({
      where: { id: pageId },
      data: {
        content: content as object,
        ...(isPublished !== undefined && { isPublished }),
      },
    })

    revalidatePath(`/${page.project.company.slug}/preview/${pageId}`)

    return { ok: true, data: updated }
  } catch (error) {
    console.error('[updatePageContent]', error)
    return { ok: false, error: 'Erro ao salvar página' }
  }
}
