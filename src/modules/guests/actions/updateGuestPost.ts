'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  postId: z.string().uuid(),
  title: z.string().optional(),
  message: z.string().min(1),
  companySlug: z.string().min(1),
})

export async function updateGuestPost(
  _prev: { ok: boolean; error?: string },
  formData: FormData
) {
  const parsed = schema.safeParse({
    postId: formData.get('postId') || '',
    title: formData.get('title') || undefined,
    message: formData.get('message') || '',
    companySlug: formData.get('companySlug') || '',
  })

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_entry_id')?.value
  if (!guestId) return { ok: false, error: 'Acesso não autorizado.' }

  const post = await db.guestPost.findUnique({ where: { id: parsed.data.postId } })
  if (!post || post.guestId !== guestId) {
    return { ok: false, error: 'Postagem não encontrada.' }
  }

  await db.guestPost.update({
    where: { id: parsed.data.postId },
    data: {
      title: parsed.data.title || null,
      message: parsed.data.message,
    },
  })

  revalidatePath(`/${parsed.data.companySlug}/guest`)
  return { ok: true }
}
