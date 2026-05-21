import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPost } from '@/modules/blog/queries/getBlogPost'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { getCompanyUsers } from '@/modules/blog/queries/getCompanyUsers'
import { PostEditorClient } from '@/components/blog/PostEditorClient'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'
import { isPrivilegedRole } from '@/lib/auth/permissions'

export const metadata = { title: 'Editar Artigo — Janus' }

export default async function SiteEditPostPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; postId: string }>
}) {
  const { companySlug, siteId, postId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const [post, categories, tags, companyUsers] = await Promise.all([
    getBlogPost(postId),
    getBlogCategories(siteId),
    getBlogTags(siteId),
    getCompanyUsers(company.id),
  ])

  if (!post || post.projectId !== siteId) redirect(`/${companySlug}/dashboard/sites/${siteId}/blog/posts`)

  const project = await db.project.findUnique({
    where: { id: siteId, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites`)

  const basePath = `/${companySlug}/dashboard/sites/${siteId}`

  const isDeveloperOrAdmin = isPrivilegedRole(session.user.role)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const apiUrl = `${proto}://${host}/api/${companySlug}/${siteId}/blog/${postId}`

  return (
    <>
      {isDeveloperOrAdmin && (
        <div className="px-8 pt-8">
          <ApiEndpointBanner url={apiUrl} />
        </div>
      )}
      <PostEditorClient
        projectId={siteId}
        companySlug={companySlug}
        basePath={basePath}
        categories={categories}
        tags={tags}
        companyUsers={companyUsers}
        post={post}
      />
    </>
  )
}
