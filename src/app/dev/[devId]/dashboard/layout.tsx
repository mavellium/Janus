import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DevSidebar } from '@/components/dev/DevSidebar'
import { MobileNav } from '@/components/dashboard/MobileNav'
import { ThemeProvider } from '@/components/ThemeContext'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'
import Link from 'next/link'

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

  const isAdmin = session.user.role === 'ADMIN'

  if (!isAdmin && session.user.role !== 'DEVELOPER') redirect('/login')
  if (!isAdmin && session.user.id !== devId) redirect(`/dev/${session.user.id}/dashboard`)

  const [user, devUser] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, preferences: true },
    }),
    isAdmin
      ? db.user.findUnique({
          where: { id: devId },
          select: { name: true, email: true },
        })
      : null,
  ])

  const prefs = (user?.preferences ?? {}) as UserPreferences

  return (
    <ThemeProvider darkMode={prefs.darkMode}>
      <div className="h-screen flex bg-brand-bg">
        <DevSidebar
          email={session.user.email ?? ''}
          image={user?.image ?? null}
          devId={devId}
        />
        <MobileNav logoHref={`/dev/${devId}/dashboard`}>
          <DevSidebar
            email={session.user.email ?? ''}
            image={user?.image ?? null}
            devId={devId}
            embedded
          />
        </MobileNav>
        <main className="flex-1 min-h-screen pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden">
          {isAdmin && (
            <div className="sticky top-0 z-50 w-full bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between text-sm font-medium shadow-md">
              <span>Modo Administrador: Visualizando {devUser?.name ?? devUser?.email ?? devId}</span>
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
