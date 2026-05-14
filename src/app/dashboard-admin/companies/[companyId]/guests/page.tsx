import { db } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { AdminCompanyGuestsClient } from './AdminCompanyGuestsClient'

export default async function AdminCompanyGuestsPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params

  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, slug: true },
  })

  if (!company) notFound()

  const guests = await db.guestEntry.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      companyId: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return <AdminCompanyGuestsClient company={company} guests={guests} />
}
