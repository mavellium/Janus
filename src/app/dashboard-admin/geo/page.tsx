import { getGeoTargetProfiles } from '@/modules/geo/queries/getGeoTargetProfiles'
import { getGeoTargetQuestions } from '@/modules/geo/queries/getGeoTargetQuestions'
import { getGeoCompetitors } from '@/modules/geo/queries/getGeoCompetitors'
import { getLatestGeoSnapshot, getGeoSnapshotHistory } from '@/modules/geo/queries/getGeoSnapshot'
import { getEnabledProviders, isProviderConfigured } from '@/modules/geo/infra/providers'
import { AdminGeoClient } from './AdminGeoClient'

export const metadata = { title: 'Raio-X de Visibilidade em IA — Admin' }

export default async function AdminGeoPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string }>
}) {
  const { profileId } = await searchParams

  const profiles = await getGeoTargetProfiles()

  const selectedProfileId = profileId ?? profiles[0]?.id ?? null

  const [questions, competitors, latestSnapshot, history] = selectedProfileId
    ? await Promise.all([
        getGeoTargetQuestions(selectedProfileId),
        getGeoCompetitors(selectedProfileId),
        getLatestGeoSnapshot(selectedProfileId),
        getGeoSnapshotHistory(selectedProfileId),
      ])
    : [[], [], null, []]

  const providers = getEnabledProviders().map((provider) => ({
    provider,
    configured: isProviderConfigured(provider),
  }))

  return (
    <AdminGeoClient
      profiles={profiles}
      selectedProfileId={selectedProfileId}
      questions={questions}
      competitors={competitors}
      latestSnapshot={latestSnapshot}
      history={history}
      providers={providers}
    />
  )
}
