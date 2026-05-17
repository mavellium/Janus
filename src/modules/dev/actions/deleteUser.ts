'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  if (session.user.role !== 'DEVELOPER') {
    return { ok: false, error: 'Acesso negado' }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { ok: false, error: 'Usuário não encontrado' }
    }

    if (user.createdById !== session.user.id) {
      return { ok: false, error: 'Você não pode deletar este usuário' }
    }

    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })

    revalidatePath(`/dev/${session.user.id}/dashboard/users`)

    return { ok: true }
  } catch (error) {
    console.error('[deleteUser]', error)
    return { ok: false, error: 'Erro ao deletar usuário' }
  }
}
