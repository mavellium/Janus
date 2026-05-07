import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import type { UserPreferences } from '@/types/next-auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const prefs = (user?.preferences ?? {}) as UserPreferences

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <Sidebar
        email={session.user.email ?? ''}
        image={user?.image ?? null}
        initialCollapsed={prefs.sidebar_collapsed ?? false}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
