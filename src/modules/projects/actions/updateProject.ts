'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface UpdateProjectParams {
  projectId: string
  name: string
  companySlug: string
  previewUrl?: string | null
  blogEnabled?: boolean
}

export async function updateProject({
  projectId,
  name,
  companySlug,
  previewUrl,
  blogEnabled,
}: UpdateProjectParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
    })

    if (!company) {
      return { ok: false, error: 'Empresa não encontrada' }
    }

    if (session.user.role !== 'ADMIN' && session.user.companySlug !== companySlug) {
      return { ok: false, error: 'Acesso negado' }
    }

    const project = await db.project.findUnique({
      where: { id: projectId, companyId: company.id, deletedAt: null },
    })

    if (!project) {
      return { ok: false, error: 'Projeto não encontrado' }
    }

    const updated = await db.project.update({
      where: { id: projectId },
      data: {
        name,
        ...(previewUrl !== undefined && { previewUrl }),
        ...(blogEnabled !== undefined && { blogEnabled }),
      },
    })

    revalidatePath(`/${companySlug}/dashboard/sites`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages`)

    return { ok: true, data: updated }
  } catch (error) {
    console.error('[updateProject]', error)
    return { ok: false, error: 'Erro ao atualizar projeto' }
  }
}
