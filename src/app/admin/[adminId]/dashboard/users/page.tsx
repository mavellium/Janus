import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminUsers } from '@/modules/admin/queries/getAdminUsers'
import { getAdminCompanies } from '@/modules/admin/queries/getAdminCompanies'
import { AdminUsersClient } from './AdminUsersClient'

export const metadata = { title: 'Usuários — Admin' }

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [users, companies] = await Promise.all([getAdminUsers(), getAdminCompanies()])

  return <AdminUsersClient users={users} companies={companies} />
}
