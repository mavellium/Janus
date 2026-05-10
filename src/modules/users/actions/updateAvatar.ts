'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateAvatar(
  userId: string,
  imageUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id || session.user.id !== userId) {
    return { ok: false, error: 'Não autorizado' }
  }

  if (!imageUrl || !imageUrl.startsWith('http')) {
    return { ok: false, error: 'URL da imagem inválida' }
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    })

    revalidatePath(`/${session.user.companySlug}/dashboard/settings`, 'page')

    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao atualizar avatar' }
  }
}
