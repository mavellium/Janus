import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPost } from '@/modules/blog/queries/getBlogPost'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { getCompanyUsers } from '@/modules/blog/queries/getCompanyUsers'
import { getBlogPostVersions } from '@/modules/blog/queries/getBlogPostVersions'
import { getBlogComments } from '@/modules/blog/queries/getBlogComments'
import { PostEditorClient } from '@/components/blog/PostEditorClient'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'
import { isEffectivePrivilegedRole } from '@/lib/auth/permissions'

export const metadata = { title: 'Editar Artigo — Janus' }

export default async function LpEditPostPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string; postId: string }>
}) {
  const { companySlug, lpId, postId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const [post, categories, tags, companyUsers, versions, comments] =
    await Promise.all([
      getBlogPost(postId),
      getBlogCategories(lpId),
      getBlogTags(lpId),
      getCompanyUsers(company.id),
      getBlogPostVersions(postId),
      getBlogComments(postId),
    ])

  if (!post || post.projectId !== lpId) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/blog/posts`)

  const project = await db.project.findUnique({
    where: { id: lpId, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages`)

  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`

  const isDeveloperOrAdmin = await isEffectivePrivilegedRole(session.user.role)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const apiUrl = `${proto}://${host}/api/${companySlug}/${lpId}/blog/${postId}`

  return (
    <>
      {isDeveloperOrAdmin && (
        <div className="px-8 pt-8">
          <ApiEndpointBanner url={apiUrl} />
        </div>
      )}
      <PostEditorClient
        projectId={lpId}
        companySlug={companySlug}
        basePath={basePath}
        categories={categories}
        tags={tags}
        companyUsers={companyUsers}
        versions={versions}
        comments={comments}
        post={post}
      />
    </>
  )
}
