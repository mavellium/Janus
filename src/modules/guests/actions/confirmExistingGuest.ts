'use server'

import { db } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function confirmExistingGuest(guestId: string, companyId: string) {
  const existing = await db.guestEntry.findUnique({ where: { id: guestId } })
  if (!existing || existing.companyId !== companyId) {
    return { ok: false, error: 'Registro não encontrado.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('guest_entry_id', existing.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return { ok: true }
}
