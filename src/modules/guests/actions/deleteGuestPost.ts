'use server'

import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

export async function deleteGuestPost(postId: string, companySlug: string) {
  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_entry_id')?.value
  if (!guestId) return { ok: false, error: 'Acesso não autorizado.' }

  const post = await db.guestPost.findUnique({ where: { id: postId } })
  if (!post || post.guestId !== guestId) {
    return { ok: false, error: 'Postagem não encontrada.' }
  }

  const guest = await db.guestEntry.findUnique({ where: { id: guestId } })

  await db.guestPost.delete({ where: { id: postId } })

  await logAudit({
    userId: null,
    userEmail: guest?.email ?? null,
    userName: guest ? `Convidado · ${guest.name}` : 'Convidado',
    action: 'DELETE',
    entity: 'GuestPost',
    entityId: postId,
    entityLabel: post.title ?? post.message.slice(0, 60),
    companyId: guest?.companyId,
    oldData: post,
  })

  revalidatePath(`/${companySlug}/guest`)
  return { ok: true }
}
