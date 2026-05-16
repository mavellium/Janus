import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ImpersonationBanner } from '@/components/dashboard/ImpersonationBanner'
import type { UserPreferences } from '@/types/next-auth'
import { getViewMode, VIEW_MODE_USER, isPrivilegedRole } from '@/lib/auth/permissions'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })

  if (!company) redirect('/login')

  const role = session.user.role
  const isPrivileged = isPrivilegedRole(role)

  if (!isPrivileged && session.user.companySlug !== companySlug) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const prefs = (user?.preferences ?? {}) as UserPreferences
  const viewMode = await getViewMode()
  const isSimulating = viewMode === VIEW_MODE_USER

  return (
    <ThemeProvider darkMode={prefs.darkMode}>
      <div className="h-screen flex bg-brand-bg">
        <Sidebar
          email={session.user.email ?? ''}
          image={user?.image ?? null}
          initialCollapsed={prefs.sidebar_collapsed ?? false}
          companyName={company.name}
        />
        <MobileNav logoHref={`/${companySlug}/dashboard`}>
          <Sidebar
            email={session.user.email ?? ''}
            image={user?.image ?? null}
            initialCollapsed={false}
            companyName={company.name}
            embedded
          />
        </MobileNav>
        <main className="flex-1 h-full pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden">
          {isPrivileged && (
            <ImpersonationBanner
              companyName={company.name}
              companySlug={companySlug}
              role={role as 'ADMIN' | 'DEVELOPER'}
              initialSimulating={isSimulating}
            />
          )}
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
