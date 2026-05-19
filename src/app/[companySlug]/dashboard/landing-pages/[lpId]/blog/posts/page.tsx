import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogPosts } from '@/modules/blog/queries/getBlogPosts'
import { PostsListClient } from '@/components/blog/PostsListClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'

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
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const posts = await getBlogPosts(lpId)
  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`

  return (
    <div className="p-8 w-full">
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <PostsListClient posts={posts} basePath={basePath} projectId={lpId} />
    </div>
  )
}
