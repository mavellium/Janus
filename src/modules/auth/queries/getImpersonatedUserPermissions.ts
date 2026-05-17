import { cookies } from 'next/headers'
import { db } from '@/lib/prisma'
import { IMPERSONATED_USER_ID_COOKIE } from '@/lib/auth/permissions'

export async function getImpersonatedUserPermissions() {
  const cookieStore = await cookies()
  const impersonatedUserId = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value

  if (!impersonatedUserId) return null

  const user = await db.user.findUnique({
    where: { id: impersonatedUserId, deletedAt: null },
    select: { permissions: true },
  })

  return user?.permissions ?? null
}
