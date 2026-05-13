import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPost } from '@/modules/blog/queries/getBlogPost'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { PostEditorClient } from '@/components/blog/PostEditorClient'

export const metadata = { title: 'Editar Artigo — Janus' }

export default async function SiteEditPostPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; postId: string }>
}) {
  const { companySlug, siteId, postId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [post, categories, tags] = await Promise.all([
    getBlogPost(postId),
    getBlogCategories(siteId),
    getBlogTags(siteId),
  ])

  if (!post || post.projectId !== siteId) redirect(`/${companySlug}/dashboard/sites/${siteId}/blog/posts`)

  const basePath = `/${companySlug}/dashboard/sites/${siteId}`
  const authorName = session.user.name ?? session.user.email ?? ''

  return (
    <PostEditorClient
      projectId={siteId}
      basePath={basePath}
      authorName={authorName}
      categories={categories}
      tags={tags}
      post={post}
    />
  )
}
