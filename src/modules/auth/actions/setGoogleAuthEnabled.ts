'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'
import { GOOGLE_PROVIDER_ID } from '@/lib/auth/oauth'

interface SetGoogleAuthEnabledParams {
  userId: string
  enabled: boolean
  revalidate?: string
}

export async function setGoogleAuthEnabled({
  userId,
  enabled,
  revalidate,
}: SetGoogleAuthEnabledParams) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }
  if (session.user.id !== userId) return { ok: false, error: 'Acesso negado' }

  try {
    const before = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, companyId: true, googleAuthEnabled: true },
    })
    if (!before) return { ok: false, error: 'Usuário não encontrado' }

    await db.user.update({
      where: { id: userId },
      data: { googleAuthEnabled: enabled },
    })

    if (!enabled) {
      await db.userOAuthAccount.deleteMany({
        where: { userId, provider: GOOGLE_PROVIDER_ID },
      })
    }

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      entityLabel: `Login com Google · ${before.email}`,
      companyId: before.companyId,
      oldData: { googleAuthEnabled: before.googleAuthEnabled },
      newData: { googleAuthEnabled: enabled },
    })

    if (revalidate) revalidatePath(revalidate)

    return { ok: true }
  } catch (error) {
    console.error('[setGoogleAuthEnabled]', error)
    return { ok: false, error: 'Erro ao atualizar o login com Google' }
  }
}
