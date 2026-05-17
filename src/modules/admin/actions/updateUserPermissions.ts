'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { ALL_PERMISSIONS, PermissionName } from '@/lib/auth/permissions'

const schema = z.object({
  userId: z.string().uuid(),
  permissions: z.array(z.string()),
})

export async function updateUserPermissions(input: z.infer<typeof schema>) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos.' }

  const target = await db.user.findUnique({
    where: { id: parsed.data.userId, deletedAt: null },
    select: { id: true, role: true },
  })
  if (!target) return { ok: false, error: 'Usuário não encontrado.' }

  const validPermissions = parsed.data.permissions.filter((permissionStr) => {
    // Format: module:tier:permissionName or module:permissionName (legacy)
    const parts = permissionStr.split(':')

    if (parts.length === 3) {
      // New format: module:tier:permissionName
      const [module, tier, permName] = parts
      if (!['sites', 'landingPages'].includes(module)) return false
      if (!['project', 'page'].includes(tier)) return false
      return ALL_PERMISSIONS.includes(permName as PermissionName)
    } else if (parts.length === 2) {
      // Legacy format: module:permissionName
      const [module, permName] = parts
      if (!['sites', 'landingPages'].includes(module)) return false
      return ALL_PERMISSIONS.includes(permName as PermissionName)
    }

    // No prefix - legacy
    return ALL_PERMISSIONS.includes(permissionStr as PermissionName)
  })

  console.log('Saving permissions for user:', parsed.data.userId, 'Valid permissions:', validPermissions)

  const updated = await db.user.update({
    where: { id: parsed.data.userId },
    data: { permissions: validPermissions },
  })

  console.log('User permissions updated:', updated.id, 'New permissions:', updated.permissions)

  // Revalidate admin pages
  revalidatePath('/dashboard-admin/users')
  revalidatePath('/dashboard-admin/developers')

  // Revalidate all dashboard pages (sites, landing pages, etc)
  revalidatePath('/', 'layout')

  console.log('Revalidated paths after permission update')

  return { ok: true }
}
