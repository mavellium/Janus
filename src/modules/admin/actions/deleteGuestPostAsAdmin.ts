'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteGuestPostAsAdmin(
  id: string,
  guestId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  await db.guestPost.delete({ where: { id } })

  revalidatePath(`/dashboard-admin/guests/${guestId}/posts`)
  return { ok: true }
}
