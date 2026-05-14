import { db } from '@/lib/prisma'
import { AdminGuestsClient } from './AdminGuestsClient'

export default async function AdminGuestsPage() {
  const guests = await db.guestEntry.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      company: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return <AdminGuestsClient guests={guests} />
}
