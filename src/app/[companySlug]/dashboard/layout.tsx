import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ThemeProvider } from '@/components/ThemeProvider'
import type { UserPreferences } from '@/types/next-auth'
import Link from 'next/link'

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

  const isAdmin = session.user.role === 'ADMIN'

  if (!isAdmin && session.user.companySlug !== companySlug) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const prefs = (user?.preferences ?? {}) as UserPreferences

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
          {isAdmin && (
            <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between text-sm font-medium shadow-md">
              <span>Modo Administrador: Visualizando {company.name}</span>
              <Link href="/dashboard-admin" className="underline underline-offset-2 hover:opacity-80 transition">
                Voltar ao Admin
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
