'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { VIEW_MODE_COOKIE, VIEW_MODE_USER, VIEW_MODE_DEV, IMPERSONATED_USER_ID_COOKIE } from '@/lib/auth/permissions'

export async function toggleViewMode(simulateUser: boolean, companySlug: string) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== 'ADMIN' && role !== 'DEVELOPER') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(VIEW_MODE_COOKIE, simulateUser ? VIEW_MODE_USER : VIEW_MODE_DEV, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  if (!simulateUser) {
    cookieStore.delete(IMPERSONATED_USER_ID_COOKIE)
  }

  revalidatePath(`/${companySlug}/dashboard`, 'layout')
  return { ok: true }
}

export async function clearViewMode() {
  const cookieStore = await cookies()
  cookieStore.delete(VIEW_MODE_COOKIE)
  cookieStore.delete(IMPERSONATED_USER_ID_COOKIE)
  return { ok: true }
}
