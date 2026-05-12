import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminDevelopers } from '@/modules/admin/queries/getAdminDevelopers'
import { AdminDevelopersClient } from './AdminDevelopersClient'

export const metadata = { title: 'Desenvolvedores — Admin' }

export default async function AdminDevelopersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const developers = await getAdminDevelopers()

  return <AdminDevelopersClient developers={developers} />
}
