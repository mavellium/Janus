'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { passwordSchema } from '@/lib/validations/password'
import type { UserPreferences } from '@/types/next-auth'

export async function resetPasswordFirstAccess({
  newPassword,
}: {
  newPassword: string
}): Promise<{ ok: boolean; error?: string; redirectUrl?: string }> {
  const session = await auth()

  if (!session?.user?.id) {
    return { ok: false, error: 'Não autorizado.' }
  }

  const parsed = passwordSchema.safeParse(newPassword)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, preferences: true, company: { select: { slug: true } } },
    })

    if (!user) {
      return { ok: false, error: 'Usuário não encontrado.' }
    }

    const hashedPassword = await hash(newPassword, 10)
    const isCompanyUser = user.role !== 'ADMIN' && user.role !== 'DEVELOPER'

    const currentPreferences = (user.preferences ?? {}) as UserPreferences

    await db.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
        requiresPasswordReset: false,
        preferences: isCompanyUser
          ? { ...currentPreferences, onboarding: { status: 'pending', step: 0 } }
          : { ...currentPreferences },
      },
    })

    if (user.role === 'DEVELOPER') {
      return { ok: true, redirectUrl: `/dev/${session.user.id}/dashboard` }
    }

    if (user.role === 'ADMIN') {
      return { ok: true, redirectUrl: '/dashboard-admin' }
    }

    return { ok: true, redirectUrl: `/${user.company?.slug}/dashboard` }
  } catch {
    return { ok: false, error: 'Erro ao atualizar senha. Tente novamente.' }
  }
}
