import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ImpersonationBanner } from '@/components/dashboard/ImpersonationBanner'
import type { UserPreferences } from '@/types/next-auth'
import { isPrivilegedRole, getImpersonatedUserId, getImpersonatedUserName, getImpersonationReturnUrl } from '@/lib/auth/permissions'
import { getCompanyUsers } from '@/modules/auth/queries/getCompanyUsers'

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
  const impersonatedUserId = await getImpersonatedUserId()
  const impersonatedUserName = await getImpersonatedUserName()
  const returnUrl = await getImpersonationReturnUrl()

  let impersonatedUserEmail: string | null = null
  let impersonatedUserNameForSidebar: string | null = null
  let impersonatedUserPermissions: string | string[] | Record<string, Record<string, string[]>> | undefined
  if (impersonatedUserId) {
    const target = await db.user.findUnique({
      where: { id: impersonatedUserId, deletedAt: null },
      select: { email: true, name: true, permissions: true },
    })
    impersonatedUserEmail = target?.email ?? null
    impersonatedUserNameForSidebar = target?.name ?? null
    impersonatedUserPermissions = target?.permissions
  }

  const realUserName = session.user.name ?? null

  let companyUsers: Array<{ id: string; name: string | null; email: string; role: string }> = []
  if (isPrivileged) {
    companyUsers = await getCompanyUsers(company.id)
  }

  return (
    <ThemeProvider darkMode={prefs.darkMode}>
      <div className="h-screen flex bg-brand-bg">
        <Sidebar
          email={impersonatedUserId && impersonatedUserEmail ? impersonatedUserEmail : session.user.email ?? ''}
          name={impersonatedUserId && impersonatedUserNameForSidebar ? impersonatedUserNameForSidebar : realUserName}
          image={user?.image ?? null}
          initialCollapsed={prefs.sidebar_collapsed ?? false}
          companyName={company.name}
        />
        <MobileNav logoHref={`/${companySlug}/dashboard`}>
          <Sidebar
            email={impersonatedUserId && impersonatedUserEmail ? impersonatedUserEmail : session.user.email ?? ''}
            name={impersonatedUserId && impersonatedUserNameForSidebar ? impersonatedUserNameForSidebar : realUserName}
            image={user?.image ?? null}
            initialCollapsed={false}
            companyName={company.name}
            embedded
          />
        </MobileNav>
        <main className="flex-1 flex flex-col min-h-0 pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden">
          {isPrivileged && (
            <ImpersonationBanner
              companySlug={companySlug}
              impersonatedUserName={impersonatedUserName}
              isImpersonating={!!impersonatedUserId}
              companyUsers={companyUsers}
              realUserRole={role as 'ADMIN' | 'DEVELOPER'}
              impersonatedUserId={impersonatedUserId}
              impersonatedUserEmail={impersonatedUserEmail}
              impersonatedUserPermissions={impersonatedUserPermissions}
              returnUrl={returnUrl}
            />
          )}
          <div className="flex-1 min-h-0">
            {children}
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}
