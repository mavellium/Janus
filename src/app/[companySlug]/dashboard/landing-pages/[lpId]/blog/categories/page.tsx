import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { CategoriesClient } from '@/components/blog/CategoriesClient'

export const metadata = { title: 'Categorias — Janus' }

export default async function LpBlogCategoriesPage({
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

  const categories = await getBlogCategories(lpId)

  return <CategoriesClient categories={categories} projectId={lpId} />
}
