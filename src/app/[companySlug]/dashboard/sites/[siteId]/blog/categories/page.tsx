import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { CategoriesClient } from '@/components/blog/CategoriesClient'

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
    select: { blogEnabled: true },
  })
  if (!project?.blogEnabled) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const categories = await getBlogCategories(siteId)

  return <CategoriesClient categories={categories} projectId={siteId} />
}
