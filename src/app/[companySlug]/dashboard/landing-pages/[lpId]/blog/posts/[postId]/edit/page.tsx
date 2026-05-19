import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
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

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const [post, categories, tags, dbUser] = await Promise.all([
    getBlogPost(postId),
    getBlogCategories(lpId),
    getBlogTags(lpId),
    db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }),
  ])

  if (!post || post.projectId !== lpId) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/blog/posts`)

  const project = await db.project.findUnique({
    where: { id: lpId, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages`)

  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`
  const authorName = dbUser?.name ?? dbUser?.email ?? ''

  return (
    <PostEditorClient
      projectId={lpId}
      companySlug={companySlug}
      basePath={basePath}
      authorName={authorName}
      categories={categories}
      tags={tags}
      post={post}
    />
  )
}
