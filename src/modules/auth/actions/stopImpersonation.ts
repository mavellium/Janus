'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { IMPERSONATED_USER_ID_COOKIE, IMPERSONATED_USER_NAME_COOKIE, IMPERSONATION_RETURN_URL_COOKIE } from '@/lib/auth/permissions'

export async function stopImpersonation(redirectTo?: string | false) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== 'ADMIN' && role !== 'DEVELOPER') {
    return { ok: false as const, error: 'Acesso não autorizado' }
  }

  const cookieStore = await cookies()

  let targetUrl: string | undefined
  if (redirectTo === false) {
    targetUrl = undefined
  } else {
    targetUrl = redirectTo ?? cookieStore.get(IMPERSONATION_RETURN_URL_COOKIE)?.value ?? undefined
  }

  cookieStore.delete(IMPERSONATED_USER_ID_COOKIE)
  cookieStore.delete(IMPERSONATED_USER_NAME_COOKIE)
  cookieStore.delete(IMPERSONATION_RETURN_URL_COOKIE)

  revalidatePath('/', 'layout')

  if (targetUrl) {
    redirect(targetUrl)
  }

  return { ok: true as const }
}
