'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  message: z.string().min(1),
  imageUrl: z.string().url(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  companySlug: z.string().min(1),
})

export async function createGuestPost(
  _prev: { ok: boolean; error?: string },
  formData: FormData
) {
  const parsed = schema.safeParse({
    message: formData.get('message') || '',
    imageUrl: formData.get('imageUrl') || '',
    mediaType: formData.get('mediaType') || 'IMAGE',
    companySlug: formData.get('companySlug') || '',
  })

  if (!parsed.success) {
    const errors = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' | ')
    return { ok: false, error: errors }
  }

  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_entry_id')?.value
  if (!guestId) return { ok: false, error: 'Acesso não autorizado.' }

  const guest = await db.guestEntry.findUnique({ where: { id: guestId } })
  if (!guest) return { ok: false, error: 'Convidado não encontrado.' }

  await db.guestPost.create({
    data: {
      message: parsed.data.message,
      imageUrl: parsed.data.imageUrl,
      mediaType: parsed.data.mediaType,
      guestId,
    },
  })

  revalidatePath(`/${parsed.data.companySlug}/guest`)
  return { ok: true }
}
