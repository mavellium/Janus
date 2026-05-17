'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { getViewMode, VIEW_MODE_DEV, getImpersonatedDevId } from '@/lib/auth/permissions'

interface UpdatePageSchemaParams {
  pageId: string
  schemaJson: string
}

export async function updatePageSchema({ pageId, schemaJson }: UpdatePageSchemaParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  const viewMode = await getViewMode()
  const isDeveloperOrInDevMode = session.user.role === 'DEVELOPER' || viewMode === VIEW_MODE_DEV

  if (!isDeveloperOrInDevMode) {
    return { ok: false, error: 'Apenas desenvolvedores podem editar o schema de páginas' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(schemaJson)
  } catch {
    return { ok: false, error: 'JSON inválido' }
  }

  try {
    const page = await db.page.findUnique({
      where: { id: pageId },
      include: { project: { include: { company: true } } },
    })

    if (!page) {
      return { ok: false, error: 'Página não encontrada' }
    }

    // In DEV_MODE, skip companySlug validation since admin is viewing dev's company
    if (viewMode !== VIEW_MODE_DEV && session.user.companySlug && page.project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    await db.page.update({
      where: { id: pageId },
      data: { schemaData: parsed as object },
    })

    const pageSlug = (page.slug ?? '').trim() === '/' || !(page.slug ?? '').trim() ? 'home' : page.slug
    revalidatePath(`/api/v1/content/${page.project.company.slug}/${pageSlug}`)

    return { ok: true }
  } catch (error) {
    console.error('[updatePageSchema]', error)
    return { ok: false, error: 'Erro ao salvar schema' }
  }
}
