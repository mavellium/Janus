import { db } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { GuestSidebar } from '@/components/guest/GuestSidebar'
import { ThemeProvider } from '@/components/ThemeProvider'

export default async function GuestLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true, name: true, guestModeEnabled: true },
  })

  if (!company || !company.guestModeEnabled) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const guestEntryId = cookieStore.get('guest_entry_id')?.value

  if (!guestEntryId) {
    redirect(`/${companySlug}/welcome`)
  }

  const guestEntry = await db.guestEntry.findUnique({
    where: { id: guestEntryId },
    select: { id: true, name: true, companyId: true },
  })

  if (!guestEntry || guestEntry.companyId !== company.id) {
    redirect(`/${companySlug}/welcome`)
  }

  return (
    <ThemeProvider>
      <div className="h-screen flex bg-brand-bg">
        <GuestSidebar
          name={guestEntry.name}
          companyName={company.name}
        />
        <main className="flex-1 h-full" style={{ marginLeft: '220px' }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
}
