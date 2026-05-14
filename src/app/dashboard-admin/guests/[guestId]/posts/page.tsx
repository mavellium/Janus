import { db } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AdminGuestPostsClient } from './AdminGuestPostsClient'

export default async function AdminGuestPostsPage({
  params,
}: {
  params: Promise<{ guestId: string }>
}) {
  const { guestId } = await params

  const guest = await db.guestEntry.findUnique({
    where: { id: guestId },
    select: {
      id: true,
      name: true,
      email: true,
      posts: {
        select: {
          id: true,
          title: true,
          message: true,
          imageUrl: true,
          guestId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      company: { select: { name: true, slug: true } },
    },
  })

  if (!guest) notFound()

  return <AdminGuestPostsClient guest={guest} />
}
