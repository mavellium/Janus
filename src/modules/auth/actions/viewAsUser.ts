'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { VIEW_MODE_COOKIE, VIEW_MODE_USER, IMPERSONATED_USER_ID_COOKIE } from '@/lib/auth/permissions'

export async function viewAsUser(userId: string, companySlug: string) {
  const cookieStore = await cookies()
  cookieStore.set(VIEW_MODE_COOKIE, VIEW_MODE_USER, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  cookieStore.set(IMPERSONATED_USER_ID_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  redirect(`/${companySlug}/dashboard`)
}
