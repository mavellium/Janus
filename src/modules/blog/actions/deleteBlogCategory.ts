'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function deleteBlogCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    const before = await db.blogCategory.findUnique({ where: { id } })
    await db.$transaction([
      db.blogCategory.updateMany({ where: { parentId: id }, data: { parentId: null } }),
      db.blogCategory.delete({ where: { id } }),
    ])
    if (before) {
      await logAudit({
        userId: session.user.id,
        action: 'DELETE',
        entity: 'BlogCategory',
        entityId: id,
        oldData: before,
      })
    }
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao excluir categoria' }
  }
}
