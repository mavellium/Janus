'use server'

import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function deleteGuestPost(postId: string, companySlug: string) {
  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_entry_id')?.value
  if (!guestId) return { ok: false, error: 'Acesso não autorizado.' }

  const post = await db.guestPost.findUnique({ where: { id: postId } })
  if (!post || post.guestId !== guestId) {
    return { ok: false, error: 'Postagem não encontrada.' }
  }

  await db.guestPost.delete({ where: { id: postId } })

  revalidatePath(`/${companySlug}/guest`)
  return { ok: true }
}
