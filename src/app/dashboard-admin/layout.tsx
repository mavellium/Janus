import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
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
        <main className="flex-1 min-h-screen" style={{ marginLeft: 'var(--sidebar-width, 220px)' }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
