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
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autenticado.' }
  }

  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Dados inválidos.' }

  const target = await db.user.findUnique({
    where: { id: parsed.data.userId, deletedAt: null },
    select: { id: true, role: true, createdById: true },
  })
  if (!target) return { ok: false, error: 'Usuário não encontrado.' }

  // Check authorization: ADMIN can update anyone, DEVELOPER can only update their own users
  const isAdmin = session.user.role === 'ADMIN'
  const isDeveloperUpdatingOwnUser = session.user.role === 'DEVELOPER' && target.createdById === session.user.id

  if (!isAdmin && !isDeveloperUpdatingOwnUser) {
    return { ok: false, error: 'Acesso não autorizado.' }
  }

  console.log('Processing permissions:', parsed.data.permissions)
  console.log('ALL_PERMISSIONS:', ALL_PERMISSIONS)

  const validPermissions = parsed.data.permissions.filter((permissionStr) => {
    // Format: module:tier:permissionName or module:permissionName (legacy)
    const parts = permissionStr.split(':')
    console.log(`Checking permission: "${permissionStr}" -> parts:`, parts)

    if (parts.length === 3) {
      // New format: module:tier:permissionName
      const [module, tier, permName] = parts
      const isValid = ['sites', 'landingPages'].includes(module) &&
                      ['project', 'page'].includes(tier) &&
                      ALL_PERMISSIONS.includes(permName as PermissionName)
      console.log(`  3-part format: module="${module}" (valid: ${['sites', 'landingPages'].includes(module)}), tier="${tier}" (valid: ${['project', 'page'].includes(tier)}), permName="${permName}" (valid: ${ALL_PERMISSIONS.includes(permName as PermissionName)}) -> ${isValid}`)
      return isValid
    } else if (parts.length === 2) {
      // Legacy format: module:permissionName
      const [module, permName] = parts
      const isValid = ['sites', 'landingPages'].includes(module) &&
                      ALL_PERMISSIONS.includes(permName as PermissionName)
      console.log(`  2-part format: module="${module}", permName="${permName}" -> ${isValid}`)
      return isValid
    }

    // No prefix - legacy
    const isValid = ALL_PERMISSIONS.includes(permissionStr as PermissionName)
    console.log(`  1-part format: permissionStr="${permissionStr}" -> ${isValid}`)
    return isValid
  })

  console.log('Saving permissions for user:', parsed.data.userId, 'Input:', parsed.data.permissions, 'Valid:', validPermissions)

  const updated = await db.user.update({
    where: { id: parsed.data.userId },
    data: { permissions: validPermissions },
  })

  console.log('User permissions updated:', updated.id, 'New permissions:', updated.permissions)

  // Revalidate admin pages
  revalidatePath('/dashboard-admin/users')
  revalidatePath('/dashboard-admin/developers')

  // Revalidate developer's user management page
  revalidatePath(`/dev/${session.user.id}/dashboard/users`)

  // Revalidate all dashboard pages (sites, landing pages, etc)
  revalidatePath('/', 'layout')

  console.log('Revalidated paths after permission update')

  return { ok: true }
}
