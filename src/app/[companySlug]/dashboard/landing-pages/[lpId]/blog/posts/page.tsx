import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPosts } from '@/modules/blog/queries/getBlogPosts'
import { PostsListClient } from '@/components/blog/PostsListClient'

export const metadata = { title: 'Artigos — Janus' }

export default async function LpBlogPostsPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string }>
}) {
  const { companySlug, lpId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: lpId, deletedAt: null },
    select: { blogEnabled: true },
  })
  if (!project?.blogEnabled) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const posts = await getBlogPosts(lpId)
  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`

  return <PostsListClient posts={posts} basePath={basePath} projectId={lpId} />
}
