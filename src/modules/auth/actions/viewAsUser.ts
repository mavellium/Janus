'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { VIEW_MODE_COOKIE, VIEW_MODE_USER, IMPERSONATED_USER_ID_COOKIE } from '@/lib/auth/permissions'

export async function viewAsUser(userId: string, companySlug: string) {
  const cookieStore = await cookies()
  console.log('[viewAsUser] Setting cookies for userId:', userId)

  // Set regular cookies with longer maxAge
  cookieStore.set(VIEW_MODE_COOKIE, VIEW_MODE_USER, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  cookieStore.set(IMPERSONATED_USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })

  console.log('[viewAsUser] Cookies set with 7-day expiry, redirecting to /' + companySlug + '/dashboard')
  redirect(`/${companySlug}/dashboard`)
}
