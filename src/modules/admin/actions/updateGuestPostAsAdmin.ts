'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  id: z.string().uuid(),
  title: z.string().optional(),
  message: z.string().min(1),
})

export async function updateGuestPostAsAdmin(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  const rawTitle = String(formData.get('title') ?? '').trim()
  const parsed = schema.safeParse({
    id: formData.get('id'),
    title: rawTitle.length > 0 ? rawTitle : undefined,
    message: formData.get('message'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const post = await db.guestPost.findUnique({
    where: { id: parsed.data.id },
    include: { guest: { select: { companyId: true } } },
  })
  if (!post) return { ok: false, error: 'Post não encontrado.' }

  const updated = await db.guestPost.update({
    where: { id: parsed.data.id },
    data: { title: parsed.data.title ?? null, message: parsed.data.message },
  })

  const { guest, ...before } = post
  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'GuestPost',
    entityId: parsed.data.id,
    entityLabel: updated.title ?? updated.message.slice(0, 60),
    companyId: guest.companyId,
    oldData: before,
    newData: updated,
  })

  revalidatePath(`/dashboard-admin/guests/${post.guestId}/posts`)
  return { ok: true }
}
