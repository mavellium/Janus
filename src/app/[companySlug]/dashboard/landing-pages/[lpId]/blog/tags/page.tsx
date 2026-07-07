import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { TagsClient } from '@/components/blog/TagsClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'
import { isEffectivePrivilegedRole } from '@/lib/auth/permissions'

export const metadata = { title: 'Tags — Janus' }

export default async function LpBlogTagsPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string }>
}) {
  const { companySlug, lpId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: lpId, deletedAt: null },
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const tags = await getBlogTags(lpId)
  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`

  const isDeveloperOrAdmin = await isEffectivePrivilegedRole(session.user.role)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const apiUrl = `${proto}://${host}/api/${companySlug}/${lpId}/blog/tags`

  return (
    <div className="w-full p-8">
      {isDeveloperOrAdmin && <ApiEndpointBanner url={apiUrl} />}
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <TagsClient tags={tags} projectId={lpId} />
    </div>
  )
}
