'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getImpersonatedUserId } from '@/lib/auth/permissions'
import type { UserPreferences } from '@/types/next-auth'

const schema = z.object({ companySlug: z.string().min(1) })

export async function restartOnboarding(input: {
  companySlug: string
}): Promise<{ ok: false; error: string } | void> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos.' }

  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado.' }

  const { companySlug } = parsed.data

  const impersonatedUserId = await getImpersonatedUserId()
  const targetUserId = impersonatedUserId ?? session.user.id

  const user = await db.user.findUnique({
    where: { id: targetUserId },
    select: { preferences: true },
  })
  if (!user) return { ok: false, error: 'Usuário não encontrado.' }

  const current = (user.preferences ?? {}) as UserPreferences

  await db.user.update({
    where: { id: targetUserId },
    data: {
      preferences: { ...current, onboarding: { status: 'pending', step: 0 } },
    },
  })

  revalidatePath(`/${companySlug}/dashboard`, 'layout')
  redirect(`/${companySlug}/dashboard`)
}
