import { cookies } from 'next/headers'
import { db } from '@/lib/prisma'
import { IMPERSONATED_DEV_ID_COOKIE } from '@/lib/auth/permissions'

export async function getImpersonatedDevPermissions() {
  const cookieStore = await cookies()
  const impersonatedDevId = cookieStore.get(IMPERSONATED_DEV_ID_COOKIE)?.value

  if (!impersonatedDevId) return null

  const user = await db.user.findUnique({
    where: { id: impersonatedDevId, deletedAt: null },
    select: { permissions: true },
  })

  return user?.permissions ?? null
}
