import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { db } from '@/lib/prisma'
import { getScriptsByProjectId } from '@/modules/scripts/queries/getScriptsByProjectId'
import { ScriptsClient } from '@/components/scripts/ScriptsClient'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'
import { isEffectivePrivilegedRole } from '@/lib/auth/permissions'

export const metadata = { title: 'Scripts — Janus' }

export default async function ScriptsPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites`)

  const scripts = await getScriptsByProjectId(siteId)

  const isDeveloperOrAdmin = await isEffectivePrivilegedRole(session.user.role)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const apiUrl = `${proto}://${host}/api/sites/${siteId}/scripts`

  return (
    <div className="w-full">
      {isDeveloperOrAdmin && <div className="px-6 sm:px-8 pt-8"><ApiEndpointBanner url={apiUrl} /></div>}
      <ScriptsClient
        scripts={scripts}
        projectId={siteId}
        companySlug={companySlug}
      />
    </div>
  )
}
