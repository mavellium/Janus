'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface UpdatePageSchemaParams {
  pageId: string
  schemaJson: string
}

export async function updatePageSchema({ pageId, schemaJson }: UpdatePageSchemaParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }
  if (session.user.role !== 'DEVELOPER') {
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

    if (page.project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    await db.page.update({
      where: { id: pageId },
      data: { schemaData: parsed as object },
    })

    revalidatePath(`/api/v1/content/${page.project.company.slug}/${page.slug}`)

    return { ok: true }
  } catch (error) {
    console.error('[updatePageSchema]', error)
    return { ok: false, error: 'Erro ao salvar schema' }
  }
}
