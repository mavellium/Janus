import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DevSidebar } from '@/components/dev/DevSidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'

export default async function DevDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ devId: string }>
}) {
  const { devId } = await params
  const session = await auth()

  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'DEVELOPER') redirect('/login')
  if (session.user.id !== devId) redirect(`/dev/${session.user.id}/dashboard`)

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const prefs = (user?.preferences ?? {}) as UserPreferences

  return (
    <ThemeProvider darkMode={prefs.darkMode}>
      <div className="h-screen flex bg-brand-bg">
        <DevSidebar
          email={session.user.email ?? ''}
          image={user?.image ?? null}
          devId={devId}
        />
        <main className="flex-1 min-h-screen" style={{ marginLeft: 'var(--sidebar-width, 220px)' }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
