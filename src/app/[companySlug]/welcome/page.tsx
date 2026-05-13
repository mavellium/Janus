import { db } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { GuestWelcomeForm } from './GuestWelcomeForm'

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true, name: true, logo: true, guestModeEnabled: true },
  })

  if (!company || !company.guestModeEnabled) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const guestEntryId = cookieStore.get('guest_entry_id')?.value
  if (guestEntryId) {
    const existing = await db.guestEntry.findUnique({
      where: { id: guestEntryId },
      select: { companyId: true },
    })
    if (existing?.companyId === company.id) {
      redirect(`/${companySlug}/guest`)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <GuestWelcomeForm company={{ id: company.id, name: company.name, logo: company.logo }} />
    </div>
  )
}
