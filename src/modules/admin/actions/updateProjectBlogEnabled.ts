'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateProjectBlogEnabled(projectId: string, blogEnabled: boolean) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'DEVELOPER') {
    return { ok: false as const, error: 'Acesso negado' }
  }

  try {
    await db.project.update({
      where: { id: projectId },
      data: { blogEnabled },
    })
    revalidatePath('/', 'layout')
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: 'Erro ao atualizar projeto' }
  }
}
