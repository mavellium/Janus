'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { IMPERSONATED_USER_ID_COOKIE, IMPERSONATED_USER_NAME_COOKIE, IMPERSONATION_RETURN_URL_COOKIE } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit-logger'

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

  const impersonatedId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value
  const impersonatedName = cookieStore.get(IMPERSONATED_USER_NAME_COOKIE)?.value

  cookieStore.delete(IMPERSONATED_USER_ID_COOKIE)
  cookieStore.delete(IMPERSONATED_USER_NAME_COOKIE)
  cookieStore.delete(IMPERSONATION_RETURN_URL_COOKIE)

  if (impersonatedId && session?.user?.id) {
    await logAudit({
      userId: session.user.id,
      action: 'DELETE',
      entity: 'Impersonation',
      entityId: impersonatedId,
      entityLabel: `Inspeção encerrada · ${impersonatedName ?? impersonatedId}`,
      oldData: { targetUserId: impersonatedId, targetName: impersonatedName },
    })
  }

  revalidatePath('/', 'layout')

  if (targetUrl) {
    redirect(targetUrl)
  }

  return { ok: true as const }
}
