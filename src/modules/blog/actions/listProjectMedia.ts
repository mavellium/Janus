'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getProjectMedia } from '@/modules/blog/queries/getProjectMedia'

export async function listProjectMedia(projectId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: 'Não autenticado', data: [] }
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { company: true },
  })
  if (!project) {
    return { ok: false as const, error: 'Projeto não encontrado', data: [] }
  }
  if (
    session.user.role !== 'ADMIN' &&
    session.user.companySlug !== project.company.slug
  ) {
    return { ok: false as const, error: 'Acesso negado', data: [] }
  }

  const data = await getProjectMedia(projectId)
  return { ok: true as const, data }
}
