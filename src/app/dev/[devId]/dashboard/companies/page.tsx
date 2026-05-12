import { getCompanies } from '@/modules/dev/queries/getCompanies'
import { CompaniesClient } from './CompaniesClient'

export const metadata = { title: 'Empresas — Dev' }

export default async function CompaniesPage() {
  const companies = await getCompanies()
  return <CompaniesClient companies={companies} />
}
