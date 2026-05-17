'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteCompany(companyId: string) {
  const session = await auth()
  if (session?.user?.role !== 'DEVELOPER' && session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  await db.company.update({
    where: { id: companyId },
    data: { deletedAt: new Date() },
  })

  revalidatePath(`/dev/${session.user.id}/dashboard/companies`)
  return { ok: true }
}
