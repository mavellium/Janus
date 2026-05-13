import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const prefs = (user?.preferences ?? {}) as UserPreferences

  return (
    <ThemeProvider darkMode={prefs.darkMode}>
      <div className="h-screen flex bg-brand-bg">
        <AdminSidebar
          email={session.user.email ?? ''}
          image={user?.image ?? null}
        />
        <MobileNav logoHref="/dashboard-admin">
          <AdminSidebar
            email={session.user.email ?? ''}
            image={user?.image ?? null}
            embedded
          />
        </MobileNav>
        <main className="flex-1 min-h-screen pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
