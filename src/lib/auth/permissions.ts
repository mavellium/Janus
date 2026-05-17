import { cookies } from 'next/headers'

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

export const VIEW_MODE_COOKIE = 'janus_view_mode'
export const VIEW_MODE_USER = 'USER_MODE'
export const VIEW_MODE_DEV = 'DEV_MODE'
export const IMPERSONATED_USER_ID_COOKIE = 'janus_impersonated_user_id'
export const IMPERSONATED_DEV_ID_COOKIE = 'janus_impersonated_dev_id'

export type ViewMode = typeof VIEW_MODE_USER | typeof VIEW_MODE_DEV

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

  // Handle JSON string
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
      // Fall through to array handling
    }
  }

  // Handle array with module:tier:permission or module:permission format
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
        // Legacy format: sites:PAGE_CREATE
        const name = cleanPerm.substring(6).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.sites.page.push(name)
      } else if (cleanPerm.startsWith('landingPages:project:')) {
        const name = cleanPerm.substring(20).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.landingPages.project.push(name)
      } else if (cleanPerm.startsWith('landingPages:page:')) {
        const name = cleanPerm.substring(17).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.landingPages.page.push(name)
      } else if (cleanPerm.startsWith('landingPages:')) {
        // Legacy format: landingPages:PAGE_CREATE
        const name = cleanPerm.substring(13).replace(/^:+|:+$/g, '').trim() as PermissionName
        if (name && ALL_PERMISSIONS.includes(name)) result.landingPages.page.push(name)
      } else if (cleanPerm) {
        // Legacy: simple permission without prefix applies to both modules, page tier
        if (ALL_PERMISSIONS.includes(cleanPerm as PermissionName)) {
          result.sites.page.push(cleanPerm as PermissionName)
          result.landingPages.page.push(cleanPerm as PermissionName)
        }
      }
    }
    return result
  }

  // Handle object
  if (typeof permissions === 'object') {
    return permissions as Record<ModuleType, Record<PermissionTier, PermissionName[]>>
  }

  return {
    sites: { project: [], page: [] },
    landingPages: { project: [], page: [] },
  }
}

export function hasPermission(
  session: SessionLike | null | undefined,
  permission: PermissionName,
  module: ModuleType = 'sites',
  tier: PermissionTier = 'page',
  viewMode?: ViewMode | null
): boolean {
  if (!session?.user) return false

  const role = session.user.role
  const normalizedPerms = normalizePermissions(session.user.permissions)
  const tierPermissions = normalizedPerms[module]?.[tier] ?? []

  console.log('[hasPermission] Checking:', {
    permission,
    module,
    tier,
    viewMode,
    role,
    tierPermissions,
    isUserMode: viewMode === VIEW_MODE_USER,
  })

  // In USER_MODE or DEV_MODE, always check permissions strictly (overrides role)
  if (viewMode === VIEW_MODE_USER || viewMode === VIEW_MODE_DEV) {
    const result = tierPermissions.includes(permission)
    console.log('[hasPermission] USER_MODE/DEV_MODE - returning:', result)
    return result
  }

  // Admins always have access (when not in USER_MODE)
  if (role === 'ADMIN') {
    console.log('[hasPermission] ADMIN - returning true')
    return true
  }

  // Developers in their own mode have full access
  if (role === 'DEVELOPER') {
    console.log('[hasPermission] DEVELOPER - returning true')
    return true
  }

  // Regular users must have explicit permission
  console.log('[hasPermission] Regular user - returning:', tierPermissions.includes(permission))
  return tierPermissions.includes(permission)
}

export async function getViewMode(): Promise<ViewMode | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(VIEW_MODE_COOKIE)?.value
  console.log('[getViewMode] Cookie value:', { VIEW_MODE_COOKIE, value, VIEW_MODE_USER, VIEW_MODE_DEV })
  if (value === VIEW_MODE_USER || value === VIEW_MODE_DEV) return value
  console.log('[getViewMode] Returning null - no valid view mode')
  return null
}

export async function checkPermission(
  session: SessionLike | null | undefined,
  permission: PermissionName,
  module: ModuleType = 'sites',
  tier: PermissionTier = 'page'
): Promise<boolean> {
  const viewMode = await getViewMode()
  console.log('[checkPermission] viewMode from getViewMode():', viewMode)
  return hasPermission(session, permission, module, tier, viewMode)
}

export async function getImpersonatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(IMPERSONATED_USER_ID_COOKIE)?.value ?? null
  console.log('[getImpersonatedUserId]', { IMPERSONATED_USER_ID_COOKIE, value })
  return value
}

export async function getImpersonatedDevId(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(IMPERSONATED_DEV_ID_COOKIE)?.value ?? null
  console.log('[getImpersonatedDevId]', { IMPERSONATED_DEV_ID_COOKIE, value })
  return value
}

export function isPrivilegedRole(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'DEVELOPER'
}
