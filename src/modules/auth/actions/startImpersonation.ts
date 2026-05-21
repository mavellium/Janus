'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { IMPERSONATED_USER_ID_COOKIE, IMPERSONATED_USER_NAME_COOKIE, IMPERSONATION_RETURN_URL_COOKIE } from '@/lib/auth/permissions'

export async function startImpersonation(targetUserId: string, companySlug: string, returnTo?: string) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== 'ADMIN' && role !== 'DEVELOPER') {
    return { ok: false as const, error: 'Acesso não autorizado' }
  }

  const targetUser = await db.user.findUnique({
    where: { id: targetUserId, deletedAt: null },
    select: { id: true, name: true, email: true },
  })

  if (!targetUser) {
    return { ok: false as const, error: 'Usuário não encontrado' }
  }

  const displayName = targetUser.name ?? targetUser.email

  const cookieStore = await cookies()

  cookieStore.set(IMPERSONATED_USER_ID_COOKIE, targetUser.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  cookieStore.set(IMPERSONATED_USER_NAME_COOKIE, displayName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  if (returnTo) {
    cookieStore.set(IMPERSONATION_RETURN_URL_COOKIE, returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
  }

  revalidatePath(`/${companySlug}/dashboard`, 'layout')
  return { ok: true as const }
}
