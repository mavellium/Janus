import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { CategoriesClient } from '@/components/blog/CategoriesClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'

export const metadata = { title: 'Categorias — Janus' }

export default async function SiteBlogCategoriesPage({
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

  const categories = await getBlogCategories(siteId)
  const basePath = `/${companySlug}/dashboard/sites/${siteId}`

  return (
    <div className="p-8 w-full">
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <CategoriesClient categories={categories} projectId={siteId} />
    </div>
  )
}
