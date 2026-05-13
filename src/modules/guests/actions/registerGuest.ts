'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  companyId: z.string().uuid(),
})

interface RegisterGuestState {
  ok: boolean
  error?: string
  existingEntry?: boolean
  guestId?: string
  existingName?: string
}

export async function registerGuest(
  _prev: RegisterGuestState,
  formData: FormData
): Promise<RegisterGuestState> {
  const parsed = schema.safeParse({
    name: formData.get('name') || '',
    email: formData.get('email') || '',
    companyId: formData.get('companyId') || '',
  })

  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const { name, email, companyId } = parsed.data

  const company = await db.company.findUnique({ where: { id: companyId, deletedAt: null } })
  if (!company || !company.guestModeEnabled) {
    return { ok: false, error: 'Modo convidado não disponível para esta empresa.' }
  }

  const existing = await db.guestEntry.findUnique({
    where: { email_companyId: { email, companyId } },
  })
  if (existing) {
    return { ok: false, existingEntry: true, guestId: existing.id, existingName: existing.name }
  }

  const guest = await db.guestEntry.create({
    data: { name, email, companyId },
  })

  const cookieStore = await cookies()
  cookieStore.set('guest_entry_id', guest.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  return { ok: true }
}
