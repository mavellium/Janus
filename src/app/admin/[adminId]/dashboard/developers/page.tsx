import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminDevelopers } from '@/modules/admin/queries/getAdminDevelopers'
import { getAdminCompanies } from '@/modules/admin/queries/getAdminCompanies'
import { AdminDevelopersClient } from './AdminDevelopersClient'

export const metadata = { title: 'Desenvolvedores — Admin' }

export default async function AdminDevelopersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [developers, companies] = await Promise.all([
    getAdminDevelopers(),
    getAdminCompanies(),
  ])

  return <AdminDevelopersClient developers={developers} companies={companies} />
}
