'use server'

import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { IMPERSONATION_RETURN_URL_COOKIE } from '@/lib/auth/permissions'

export async function setReturnUrl(url: string) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== 'ADMIN' && role !== 'DEVELOPER') {
    return { ok: false as const }
  }

  const cookieStore = await cookies()
  cookieStore.set(IMPERSONATION_RETURN_URL_COOKIE, url, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  return { ok: true as const }
}
