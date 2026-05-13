import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { PostEditorClient } from '@/components/blog/PostEditorClient'

export const metadata = { title: 'Novo Artigo — Janus' }

export default async function LpNewPostPage({
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

  const [categories, tags] = await Promise.all([
    getBlogCategories(lpId),
    getBlogTags(lpId),
  ])

  const basePath = `/${companySlug}/dashboard/landing-pages/${lpId}`
  const authorName = session.user.name ?? session.user.email ?? ''

  return (
    <PostEditorClient
      projectId={lpId}
      basePath={basePath}
      authorName={authorName}
      categories={categories}
      tags={tags}
    />
  )
}
