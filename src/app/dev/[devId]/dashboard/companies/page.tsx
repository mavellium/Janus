import { getCompanies } from '@/modules/dev/queries/getCompanies'
import { CompaniesClient } from './CompaniesClient'

export const metadata = { title: 'Empresas — Dev' }

export default async function CompaniesPage({
  params,
}: {
  params: Promise<{ devId: string }>
}) {
  const { devId } = await params
  const companies = await getCompanies(devId)
  return <CompaniesClient companies={companies} />
}
