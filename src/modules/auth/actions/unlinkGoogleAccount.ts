'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { logAudit } from '@/lib/audit-logger'
import { GOOGLE_PROVIDER_ID } from '@/lib/auth/oauth'

interface UnlinkGoogleAccountParams {
  userId: string
  revalidate?: string
}

export async function unlinkGoogleAccount({ userId, revalidate }: UnlinkGoogleAccountParams) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }
  if (session.user.id !== userId) return { ok: false, error: 'Acesso negado' }

  try {
    const account = await db.userOAuthAccount.findUnique({
      where: { userId_provider: { userId, provider: GOOGLE_PROVIDER_ID } },
      select: { providerEmail: true, linkedAt: true },
    })
    if (!account) return { ok: false, error: 'Nenhuma conta Google vinculada' }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, companyId: true },
    })

    await db.userOAuthAccount.delete({
      where: { userId_provider: { userId, provider: GOOGLE_PROVIDER_ID } },
    })

    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'User',
      entityId: userId,
      entityLabel: `Conta Google desvinculada · ${user?.email ?? userId}`,
      companyId: user?.companyId,
      oldData: {
        provider: GOOGLE_PROVIDER_ID,
        providerEmail: account.providerEmail,
        linkedAt: account.linkedAt.toISOString(),
      },
    })

    if (revalidate) revalidatePath(revalidate)

    return { ok: true }
  } catch (error) {
    console.error('[unlinkGoogleAccount]', error)
    return { ok: false, error: 'Erro ao desvincular a conta Google' }
  }
}
