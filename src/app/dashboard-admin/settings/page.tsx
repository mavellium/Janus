import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { DevSettingsClient } from '@/app/dev/[devId]/dashboard/settings/DevSettingsClient'
import type { UserPreferences } from '@/types/next-auth'

export const metadata = { title: 'Configurações — Admin' }

export default async function AdminSettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, phone: true, image: true, requiresPasswordReset: true, preferences: true },
  })

  if (!user) redirect('/login')

  return (
    <DevSettingsClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name ?? '',
        phone: user.phone ?? '',
        image: user.image ?? null,
        requiresPasswordReset: user.requiresPasswordReset,
        preferences: (user.preferences as UserPreferences) ?? {},
      }}
    />
  )
}
