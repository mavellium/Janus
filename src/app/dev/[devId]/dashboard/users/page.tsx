import { getUsers } from '@/modules/dev/queries/getUsers'
import { getCompanies } from '@/modules/dev/queries/getCompanies'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Usuários — Dev' }

export default async function UsersPage() {
  const [users, companies] = await Promise.all([getUsers(), getCompanies()])

  const companiesForSelect = companies.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))

  return <UsersClient users={users} companies={companiesForSelect} />
}
