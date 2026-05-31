'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'

interface UpdatePageAdvancedDataParams {
  pageId: string
  schemaJson: string
  uiSchemaJson: string
}

export async function updatePageAdvancedData({
  pageId,
  schemaJson,
  uiSchemaJson,
}: UpdatePageAdvancedDataParams) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  if (session.user.role !== 'DEVELOPER' && session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Apenas desenvolvedores podem editar o schema de páginas' }
  }

  let parsedSchema: unknown
  let parsedUiSchema: unknown

  try {
    parsedSchema = JSON.parse(schemaJson)
  } catch {
    return { ok: false, error: 'JSON de dados inválido' }
  }

  try {
    parsedUiSchema = JSON.parse(uiSchemaJson)
  } catch {
    return { ok: false, error: 'JSON de interface inválido' }
  }

  try {
    const page = await db.page.findUnique({
      where: { id: pageId },
      include: { project: { include: { company: true } } },
    })

    if (!page) return { ok: false, error: 'Página não encontrada' }

    if (session.user.role === 'DEVELOPER' && session.user.companySlug && page.project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    await db.page.update({
      where: { id: pageId },
      data: {
        schemaData: parsedSchema as object,
        uiSchema: parsedUiSchema as object,
      },
    })

    const pageSlug =
      (page.slug ?? '').trim() === '/' || !(page.slug ?? '').trim() ? 'home' : page.slug
    revalidatePath(`/api/v1/content/${page.project.company.slug}/${pageSlug}`)
    revalidateSites(page.project.company.slug)

    return { ok: true }
  } catch (error) {
    console.error('[updatePageAdvancedData]', error)
    return { ok: false, error: 'Erro ao salvar dados avançados' }
  }
}
