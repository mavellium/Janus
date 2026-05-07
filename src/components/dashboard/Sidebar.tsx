import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SidebarClient } from './SidebarClient'
import type { UserPreferences } from '@/types/next-auth'

export async function Sidebar() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const preferences = (session.user.preferences ?? {}) as UserPreferences
  const defaultCollapsed = preferences.sidebar_collapsed ?? false

  return (
    <SidebarClient
      email={session.user.email ?? ''}
      image={session.user.image}
      defaultCollapsed={defaultCollapsed}
    />
  )
}
