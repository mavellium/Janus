import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { SettingsClient } from './settings.client'
import type { UserPreferences } from '@/types/next-auth'

export const metadata = { title: 'Configurações — Janus' }

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      image: true,
      preferences: true,
    }
  })

  return (
    <SettingsClient
      user={{
        id: user?.id || session.user.id,
        email: user?.email || session.user.email!,
        name: user?.name || user?.image || '',
        phone: user?.phone || '',
        image: user?.image || null,
        preferences: (user?.preferences as UserPreferences) || {},
      }}
      company={company}
    />
  )
}
