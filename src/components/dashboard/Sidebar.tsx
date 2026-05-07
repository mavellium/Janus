import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { SidebarClient } from './SidebarClient'
import type { UserPreferences } from '@/types/next-auth'

export async function Sidebar() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const preferences = (user?.preferences ?? {}) as UserPreferences
  const defaultCollapsed = preferences.sidebar_collapsed ?? false

  return (
    <SidebarClient
      email={session.user.email ?? ''}
      image={user?.image ?? null}
      defaultCollapsed={defaultCollapsed}
    />
  )
}
