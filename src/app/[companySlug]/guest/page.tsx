import { db } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { GuestGalleryClient } from './GuestGalleryClient'

export default async function GuestGalleryPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params

  const cookieStore = await cookies()
  const guestEntryId = cookieStore.get('guest_entry_id')?.value
  if (!guestEntryId) redirect(`/${companySlug}/welcome`)

  const guestEntry = await db.guestEntry.findUnique({
    where: { id: guestEntryId },
    include: {
      company: { select: { slug: true } },
      posts: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!guestEntry || guestEntry.company.slug !== companySlug) {
    redirect(`/${companySlug}/welcome`)
  }

  return (
    <GuestGalleryClient
      guest={{
        id: guestEntry.id,
        name: guestEntry.name,
        email: guestEntry.email,
      }}
      posts={guestEntry.posts.map((p) => ({
        id: p.id,
        title: p.title,
        message: p.message,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
      }))}
      companySlug={companySlug}
    />
  )
}
