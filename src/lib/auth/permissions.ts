import { cookies } from 'next/headers'
import { db } from '@/lib/prisma'

export const PERMISSIONS = {
  PROJECT_CREATE: 'PROJECT_CREATE',
  PROJECT_EDIT: 'PROJECT_EDIT',
  PROJECT_DELETE: 'PROJECT_DELETE',
  PAGE_CREATE: 'PAGE_CREATE',
  PAGE_DELETE: 'PAGE_DELETE',
  PAGE_BUILD: 'PAGE_BUILD',
  BLOG_MANAGE: 'BLOG_MANAGE',
  GUEST_MANAGE: 'GUEST_MANAGE',
  TEAM_MANAGE: 'TEAM_MANAGE',
} as const

export type PermissionName = keyof typeof PERMISSIONS
export type ModuleType = 'sites' | 'landingPages'
export type PermissionTier = 'project' | 'page'

export const ALL_PERMISSIONS: PermissionName[] = Object.keys(PERMISSIONS) as PermissionName[]

export const IMPERSONATED_USER_ID_COOKIE = 'janus_impersonated_user_id'
export const IMPERSONATED_USER_NAME_COOKIE = 'janus_impersonated_user_name'
export const IMPERSONATION_RETURN_URL_COOKIE = 'janus_impersonation_return_url'

interface SessionLike {
  user?: {
    role?: string
    permissions?: string | string[] | Record<string, Record<string, string[]>>
  }
}

export function normalizePermissions(
  permissions?: string | string[] | Record<string, Record<string, string[]>>
): Record<ModuleType, Record<PermissionTier, PermissionName[]>> {
  if (!permissions) {
    return {
      sites: { project: [], page: [] },
      landingPages: { project: [], page: [] },
    }
  }

  if (typeof permissions === 'string' && permissions.startsWith('{')) {
    try {
      const parsed = JSON.parse(permissions)
      if (
        parsed.sites &&
        parsed.landingPages &&
        parsed.sites.project &&
        parsed.sites.page
      ) {
        return parsed as Record<ModuleType, Record<PermissionTier, PermissionName[]>>
      }
    } catch {
    }
  }

  if (Array.isArray(permissions)) {
    const result: Record<ModuleType, Record<PermissionTier, PermissionName[]>> = {
      sites: { project: [], page: [] },
      landingPages: { project: [], page: [] },
    }

    for (const perm of permissions) {
      const cleanPerm = perm.trim()
      if (cleanPerm.startsWith('sites:project:')) {
        const name = cleanPerm.substring(14).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.sites.project.push(name)
      } else if (cleanPerm.startsWith('sites:page:')) {
        const name = cleanPerm.substring(11).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.sites.page.push(name)
      } else if (cleanPerm.startsWith('sites:')) {
        const name = cleanPerm.substring(6).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.sites.page.push(name)
      } else if (cleanPerm.startsWith('landingPages:project:')) {
        const name = cleanPerm.substring(20).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.landingPages.project.push(name)
      } else if (cleanPerm.startsWith('landingPages:page:')) {
        const name = cleanPerm.substring(17).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.landingPages.page.push(name)
      } else if (cleanPerm.startsWith('landingPages:')) {
        const name = cleanPerm.substring(13).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.landingPages.page.push(name)
      } else if (cleanPerm) {
        if (ALL_PERMISSIONS.includes(cleanPerm as PermissionName)) {
          result.sites.page.push(cleanPerm as PermissionName)
          result.landingPages.page.push(cleanPerm as PermissionName)
        }
      }
    }
    return result
  }

  if (typeof permissions === 'object') {
    return permissions as Record<ModuleType, Record<PermissionTier, PermissionName[]>>
  }

  return {
    sites: { project: [], page: [] },
    landingPages: { project: [], page: [] },
  }
}

export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies()
  return !!cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value
}

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value ?? null
}

export async function getImpersonatedUserName(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATED_USER_NAME_COOKIE)?.value ?? null
}

export async function getImpersonationReturnUrl(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(IMPERSONATION_RETURN_URL_COOKIE)?.value ?? null
}

export async function getEffectivePermissions(
  realUserId: string
): Promise<string | string[] | Record<string, Record<string, string[]>> | null> {
  const impersonatedId = await getImpersonatedUserId()

  if (impersonatedId) {
    const target = await db.user.findUnique({
      where: { id: impersonatedId, deletedAt: null },
      select: { permissions: true },
    })
    return target?.permissions ?? null
  }

  const user = await db.user.findUnique({
    where: { id: realUserId, deletedAt: null },
    select: { permissions: true },
  })
  return user?.permissions ?? null
}

export function hasPermission(
  session: SessionLike | null | undefined,
  permission: PermissionName,
  module: ModuleType = 'sites',
  tier: PermissionTier = 'page',
  impersonating = false
): boolean {
  if (!session?.user) return false

  const role = session.user.role
  const normalizedPerms = normalizePermissions(session.user.permissions)
  const tierPermissions = normalizedPerms[module]?.[tier] ?? []

  if (impersonating) {
    return tierPermissions.includes(permission)
  }

  if (role === 'ADMIN' || role === 'DEVELOPER') {
    return true
  }

  return tierPermissions.includes(permission)
}

export async function checkPermission(
  session: SessionLike | null | undefined,
  permission: PermissionName,
  module: ModuleType = 'sites',
  tier: PermissionTier = 'page'
): Promise<boolean> {
  if (!session?.user) return false

  const impersonating = await isImpersonating()

  if (impersonating) {
    const impersonatedPerms = await getEffectivePermissions('')
    const impersonatedSession: SessionLike = {
      user: { role: 'DEFAULT', permissions: impersonatedPerms ?? undefined },
    }
    return hasPermission(impersonatedSession, permission, module, tier, true)
  }

  return hasPermission(session, permission, module, tier, false)
}

export function isPrivilegedRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'DEVELOPER'
}
