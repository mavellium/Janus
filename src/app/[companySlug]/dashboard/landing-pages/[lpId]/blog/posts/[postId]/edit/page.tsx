import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getBlogPost } from '@/modules/blog/queries/getBlogPost'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { PostEditorClient } from '@/components/blog/PostEditorClient'

export const metadata = { title: 'Editar Artigo — Janus' }

export default async function LpEditPostPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string; postId: string }>
}) {
  const { companySlug, lpId, postId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [post, categories, tags] = await Promise.all([
    getBlogPost(postId),
    getBlogCategories(lpId),
    getBlogTags(lpId),
  ])

  if (!post || post.projectId !== lpId) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/blog/posts`)

  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`
  const authorName = session.user.name ?? session.user.email ?? ''

  return (
    <PostEditorClient
      projectId={lpId}
      basePath={basePath}
      authorName={authorName}
      categories={categories}
      tags={tags}
      post={post}
    />
  )
}
