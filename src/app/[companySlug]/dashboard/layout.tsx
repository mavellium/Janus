import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ThemeProvider } from '@/components/ThemeProvider'
import type { UserPreferences } from '@/types/next-auth'

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

  if (session.user.companySlug !== companySlug) {
    redirect(`/${session.user.companySlug}/dashboard`)
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, preferences: true },
  })

  const prefs = (user?.preferences ?? {}) as UserPreferences

  return (
    <ThemeProvider darkMode={prefs.darkMode}>
      <div className="min-h-screen flex bg-brand-bg">
        <Sidebar
          email={session.user.email ?? ''}
          image={user?.image ?? null}
          initialCollapsed={prefs.sidebar_collapsed ?? false}
          companyName={company.name}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </ThemeProvider>
  )
}
