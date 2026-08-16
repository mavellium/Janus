import { cookies } from 'next/headers'

export const REMEMBER_SESSION_COOKIE = 'janus.remember_session'
export const REMEMBERED_EMAIL_COOKIE = 'janus.remembered_email'

export const REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30
export const SHORT_SESSION_MAX_AGE = 60 * 60 * 8
const PREFERENCE_MAX_AGE = 60 * 60 * 24 * 365

function preferenceCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PREFERENCE_MAX_AGE,
  }
}

export async function resolveSessionMaxAge(): Promise<number> {
  try {
    const store = await cookies()
    const preference = store.get(REMEMBER_SESSION_COOKIE)?.value
    return preference === '0' ? SHORT_SESSION_MAX_AGE : REMEMBERED_SESSION_MAX_AGE
  } catch {
    return REMEMBERED_SESSION_MAX_AGE
  }
}

export async function saveSessionPreference(remember: boolean, email?: string): Promise<void> {
  const store = await cookies()
  const options = preferenceCookieOptions()

  store.set(REMEMBER_SESSION_COOKIE, remember ? '1' : '0', options)

  if (remember && email) {
    store.set(REMEMBERED_EMAIL_COOKIE, email, options)
    return
  }
  store.set(REMEMBERED_EMAIL_COOKIE, '', { ...options, maxAge: 0 })
}

export async function readSessionPreference(): Promise<{ remember: boolean; email: string }> {
  const store = await cookies()
  return {
    remember: store.get(REMEMBER_SESSION_COOKIE)?.value !== '0',
    email: store.get(REMEMBERED_EMAIL_COOKIE)?.value ?? '',
  }
}
