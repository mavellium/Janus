import {
  getSystemReleases,
  countUnreadReleases,
  RELEASES_PER_PAGE,
} from '@/modules/notifications/queries/getReleases'
import { NotificationsFeed } from '@/components/notifications/NotificationsFeed'
import { MarkNotificationsSeen } from '@/components/notifications/MarkNotificationsSeen'

export async function NotificationsContent({ userId }: { userId: string }) {
  const [releases, unreadCount] = await Promise.all([
    getSystemReleases(),
    countUnreadReleases(userId),
  ])

  return (
    <>
      <MarkNotificationsSeen hasUnread={unreadCount > 0} />
      <NotificationsFeed
        releases={releases}
        initialHasMore={releases.length === RELEASES_PER_PAGE}
      />
    </>
  )
}
