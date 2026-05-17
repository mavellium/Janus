'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  VIEW_MODE_COOKIE,
  VIEW_MODE_DEV,
  IMPERSONATED_DEV_ID_COOKIE,
  IMPERSONATED_USER_ID_COOKIE,
} from '@/lib/auth/permissions'

export async function viewAsDeveloper(devId: string, companySlug: string) {
  const cookieStore = await cookies()

  cookieStore.set(VIEW_MODE_COOKIE, VIEW_MODE_DEV, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  cookieStore.set(IMPERSONATED_DEV_ID_COOKIE, devId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })

  cookieStore.delete(IMPERSONATED_USER_ID_COOKIE)

  redirect(`/${companySlug}/dashboard`)
}
