'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function toggleBlogEnabled(projectId: string, enabled: boolean) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await db.project.update({
      where: { id: projectId },
      data: { blogEnabled: enabled },
    })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao atualizar configuração' }
  }
}
