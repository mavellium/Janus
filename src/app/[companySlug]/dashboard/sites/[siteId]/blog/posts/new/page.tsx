import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { getBlogTags } from '@/modules/blog/queries/getBlogTags'
import { getCompanyUsers } from '@/modules/blog/queries/getCompanyUsers'
import { PostEditorClient } from '@/components/blog/PostEditorClient'

export const metadata = { title: 'Novo Artigo — Janus' }

export default async function SiteNewPostPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, companyId: company.id, deletedAt: null },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const [categories, tags, companyUsers] = await Promise.all([
    getBlogCategories(siteId),
    getBlogTags(siteId),
    getCompanyUsers(company.id),
  ])

  const basePath = `/${companySlug}/dashboard/sites/${siteId}`

  return (
    <PostEditorClient
      projectId={siteId}
      companySlug={companySlug}
      basePath={basePath}
      categories={categories}
      tags={tags}
      companyUsers={companyUsers}
    />
  )
}
