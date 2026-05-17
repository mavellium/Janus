import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminDevelopers } from '@/modules/admin/queries/getAdminDevelopers'
import { getAdminCompanies } from '@/modules/admin/queries/getAdminCompanies'
import { AdminDevelopersClient } from './AdminDevelopersClient'

export const metadata = { title: 'Desenvolvedores — Admin' }

export default async function AdminDevelopersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const developers = await getAdminDevelopers()
  const allCompanies = await getAdminCompanies()

  const companiesByDev = new Map<string, typeof allCompanies>()
  for (const dev of developers) {
    const devCompanies = allCompanies.filter((c) => c.createdById === dev.id)
    companiesByDev.set(dev.id, devCompanies)
  }

  return <AdminDevelopersClient developers={developers} companiesByDev={companiesByDev} />
}
