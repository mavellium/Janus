'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteGuestAsAdmin(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  await db.guestEntry.delete({ where: { id } })

  revalidatePath('/dashboard-admin/guests')
  return { ok: true }
}
