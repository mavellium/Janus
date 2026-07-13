'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

interface UpdateProfileParams {
  userId: string
  name: string
  email: string
  phone?: string
}

export async function updateProfile({
  userId,
  name,
  email,
  phone,
}: UpdateProfileParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado' }
  }

  if (session.user.id !== userId) {
    return { ok: false, error: 'Acesso negado' }
  }

  try {
    const before = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, companyId: true },
    })

    const updated = await db.user.update({
      where: { id: userId },
      data: { name, email, phone: phone || null },
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      entityLabel: `Perfil · ${updated.email}`,
      companyId: before?.companyId,
      oldData: {
        name: before?.name,
        email: before?.email,
        phone: before?.phone,
      },
      newData: { name, email, phone: phone || null },
    })

    revalidatePath('/dashboard/settings')

    return { ok: true }
  } catch (error) {
    console.error('[updateProfile]', error)
    return { ok: false, error: 'Erro ao atualizar perfil' }
  }
}
