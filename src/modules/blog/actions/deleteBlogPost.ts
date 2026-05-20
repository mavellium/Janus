'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'

export async function deleteBlogPost(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await db.blogPost.delete({ where: { id } })
    revalidatePath('/', 'layout')
    revalidateSites()
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao excluir artigo' }
  }
}
