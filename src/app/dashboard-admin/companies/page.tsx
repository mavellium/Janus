import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminCompanies } from '@/modules/admin/queries/getAdminCompanies'
import { AdminCompaniesClient } from './AdminCompaniesClient'

export const metadata = { title: 'Empresas — Admin' }

export default async function AdminCompaniesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const companies = await getAdminCompanies()

  return <AdminCompaniesClient companies={companies} currentRole={session.user.role} />
}
