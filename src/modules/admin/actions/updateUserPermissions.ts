'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ALL_PERMISSIONS, PermissionName } from '@/lib/auth/permissions'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  userId: z.string().uuid(),
  permissions: z.array(z.string()),
})

export async function updateUserPermissions(input: z.infer<typeof schema>) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos.' }

  const target = await db.user.findUnique({
    where: { id: parsed.data.userId, deletedAt: null },
    select: {
      id: true,
      role: true,
      createdById: true,
      email: true,
      name: true,
      companyId: true,
      permissions: true,
    },
  })
  if (!target) return { ok: false, error: 'Usuário não encontrado.' }

  // Check authorization: ADMIN can update anyone, DEVELOPER can only update their own users
  const isAdmin = session.user.role === 'ADMIN'
  const isDeveloperUpdatingOwnUser = session.user.role === 'DEVELOPER' && target.createdById === session.user.id

  if (!isAdmin && !isDeveloperUpdatingOwnUser) {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const validPermissions = parsed.data.permissions.filter((permissionStr) => {
    const parts = permissionStr.split(':')

    if (parts.length === 3) {
      const [module, tier, permName] = parts
      return (
        ['sites', 'landingPages'].includes(module) &&
        ['project', 'page'].includes(tier) &&
        ALL_PERMISSIONS.includes(permName as PermissionName)
      )
    }

    if (parts.length === 2) {
      const [module, permName] = parts
      return (
        ['sites', 'landingPages'].includes(module) &&
        ALL_PERMISSIONS.includes(permName as PermissionName)
      )
    }

    return ALL_PERMISSIONS.includes(permissionStr as PermissionName)
  })

  const updated = await db.user.update({
    where: { id: parsed.data.userId },
    data: { permissions: validPermissions },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: target.id,
    entityLabel: `Permissões · ${target.email}`,
    companyId: target.companyId,
    oldData: { permissions: target.permissions },
    newData: { permissions: updated.permissions },
  })

  revalidatePath('/dashboard-admin/users')
  revalidatePath('/dashboard-admin/developers')
  revalidatePath(`/dev/${session.user.id}/dashboard/users`)
  revalidatePath('/', 'layout')

  return { ok: true }
}
