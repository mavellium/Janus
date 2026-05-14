'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

interface CreateProjectParams {
  name: string
  type: 'LANDING_PAGE' | 'INSTITUTIONAL'
  companySlug: string
}

export async function createProject({
  name,
  type,
  companySlug,
}: CreateProjectParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug },
    })

    if (!company) {
      return { ok: false, error: 'Empresa não encontrada' }
    }

    if (company.slug !== session.user.companySlug && session.user.role !== 'ADMIN') {
      return { ok: false, error: 'Acesso negado' }
    }

    const project = await db.project.create({
      data: {
        name,
        type,
        companyId: company.id,
      },
    })

    const homePage = await db.page.create({
      data: {
        name: 'Home',
        slug: '/',
        content: { nodes: [], globalSettings: {} },
        projectId: project.id,
      },
    })

    return { ok: true, data: { projectId: project.id, pageId: homePage.id } }
  } catch (error) {
    console.error('[createProject]', error)
    return { ok: false, error: 'Erro ao criar projeto' }
  }
}
