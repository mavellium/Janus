'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function toggleGuestMode(companyId: string, enabled: boolean) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  await db.company.update({
    where: { id: companyId },
    data: { guestModeEnabled: enabled },
  })

  revalidatePath('/dashboard-admin/companies')
  return { ok: true }
}
