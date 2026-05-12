'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function adminDeleteCompany(id: string) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  await db.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/dashboard-admin/companies')
  return { ok: true }
}
