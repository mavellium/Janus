'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { uploadImage } from '@/modules/upload/actions/uploadImage'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  title: z.string().optional(),
  message: z.string().min(1),
  companySlug: z.string().min(1),
})

export async function createGuestPost(
  _prev: { ok: boolean; error?: string },
  formData: FormData
) {
  const parsed = schema.safeParse({
    title: formData.get('title') || undefined,
    message: formData.get('message') || '',
    companySlug: formData.get('companySlug') || '',
  })

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_entry_id')?.value
  if (!guestId) return { ok: false, error: 'Acesso não autorizado.' }

  const guest = await db.guestEntry.findUnique({ where: { id: guestId } })
  if (!guest) return { ok: false, error: 'Convidado não encontrado.' }

  const imageFile = formData.get('image') as File | null
  if (!imageFile || imageFile.size === 0) {
    return { ok: false, error: 'Imagem é obrigatória.' }
  }

  const uploadResult = await uploadImage({ file: imageFile, folder: 'guest-posts' })
  if (!uploadResult.ok) return { ok: false, error: uploadResult.error }

  await db.guestPost.create({
    data: {
      title: parsed.data.title || null,
      message: parsed.data.message,
      imageUrl: uploadResult.url!,
      guestId,
    },
  })

  revalidatePath(`/${parsed.data.companySlug}/guest`)
  return { ok: true }
}
