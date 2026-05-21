'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface CreatePageParams {
  projectId: string
  name: string
  slug: string
  companySlug: string
  previewUrl?: string
}

export async function createPage({ projectId, name, slug, companySlug, previewUrl }: CreatePageParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }
  if (session.user.role !== 'DEVELOPER' && session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Apenas desenvolvedores podem criar páginas estruturais' }
  }

  const trimmedName = name.trim()
  const trimmedSlug = slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  if (!trimmedName) {
    return { ok: false, error: 'Nome da página é obrigatório' }
  }
  if (!trimmedSlug) {
    return { ok: false, error: 'Slug inválido' }
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { company: true },
    })

    if (!project) {
      return { ok: false, error: 'Projeto não encontrado' }
    }

    if (project.company.slug !== companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    if (session.user.role === 'DEVELOPER' && session.user.companySlug && project.company.slug !== session.user.companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    const existing = await db.page.findUnique({
      where: { projectId_slug: { projectId, slug: trimmedSlug } },
    })

    if (existing) {
      return { ok: false, error: 'Já existe uma página com este slug neste projeto' }
    }

    const page = await db.page.create({
      data: {
        projectId,
        name: trimmedName,
        slug: trimmedSlug,
        content: {},
        schemaData: {},
        contentData: {},
        previewUrl: previewUrl || null,
      },
    })

    revalidatePath(`/${companySlug}/dashboard/sites/${projectId}/pages`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages/${projectId}/pages`)

    return { ok: true, data: page }
  } catch (error) {
    console.error('[createPage]', error)
    return { ok: false, error: 'Erro ao criar página' }
  }
}
