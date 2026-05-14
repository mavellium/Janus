'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

interface UpdateProjectParams {
  projectId: string
  name: string
  companySlug: string
  previewUrl?: string | null
}

export async function updateProject({
  projectId,
  name,
  companySlug,
  previewUrl,
}: UpdateProjectParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { company: true },
    })

    if (!project) {
      return { ok: false, error: 'Projeto não encontrado' }
    }

    if (session.user.role !== 'ADMIN' && (project.company.slug !== session.user.companySlug || project.company.slug !== companySlug)) {
      return { ok: false, error: 'Acesso negado' }
    }

    const updated = await db.project.update({
      where: { id: projectId },
      data: {
        name,
        ...(previewUrl !== undefined && { previewUrl }),
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
