import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { NotificationsContent } from '@/components/notifications/NotificationsContent'
import { NotificationsSkeleton } from '@/components/notifications/NotificationsSkeleton'
import { RefreshReleasesButton } from '@/components/notifications/RefreshReleasesButton'

export const metadata = { title: 'Notificações — Admin Janus' }

export default async function AdminNotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/login')

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">Notificações</h1>
          <p className="text-sm text-brand-muted mt-1">
            Atualizações de versão e novidades do sistema
          </p>
        </div>
        <RefreshReleasesButton />
      </div>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationsContent userId={session.user.id} />
      </Suspense>
    </div>
  )
}
