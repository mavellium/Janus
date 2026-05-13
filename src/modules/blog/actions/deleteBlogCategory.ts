'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteBlogCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await db.blogCategory.delete({ where: { id } })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao excluir categoria' }
  }
}
