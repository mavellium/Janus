import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { DevSettingsClient } from './DevSettingsClient'
import type { UserPreferences } from '@/types/next-auth'

export const metadata = { title: 'Configurações — Dev' }

export default async function DevSettingsPage({
  params,
}: {
  params: Promise<{ devId: string }>
}) {
  const { devId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: devId },
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
