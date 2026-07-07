import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPosts } from '@/modules/blog/queries/getBlogPosts'
import { PostsListClient } from '@/components/blog/PostsListClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'
import { isEffectivePrivilegedRole } from '@/lib/auth/permissions'

export const metadata = { title: 'Artigos — Janus' }

export default async function SiteBlogPostsPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const posts = await getBlogPosts(siteId)
  const basePath = `/${companySlug}/dashboard/sites/${siteId}`

  const isDeveloperOrAdmin = await isEffectivePrivilegedRole(session.user.role)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const apiUrl = `${proto}://${host}/api/${companySlug}/${siteId}/blog`

  return (
    <div className="w-full p-8">
      {isDeveloperOrAdmin && <ApiEndpointBanner url={apiUrl} />}
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <PostsListClient posts={posts} basePath={basePath} projectId={siteId} />
    </div>
  )
}
