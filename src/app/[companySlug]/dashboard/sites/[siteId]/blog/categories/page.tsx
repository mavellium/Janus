import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getBlogCategories } from '@/modules/blog/queries/getBlogCategories'
import { CategoriesClient } from '@/components/blog/CategoriesClient'
import { BlogManagementHeader } from '@/components/blog/BlogManagementHeader'
import { ApiEndpointBanner } from '@/components/blog/ApiEndpointBanner'
import { isPrivilegedRole } from '@/lib/auth/permissions'

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

  const isDeveloperOrAdmin = isPrivilegedRole(session.user.role)
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const apiUrl = `${proto}://${host}/api/${companySlug}/${siteId}/blog/categories`

  return (
    <div className="w-full p-8">
      {isDeveloperOrAdmin && <ApiEndpointBanner url={apiUrl} />}
      <BlogManagementHeader basePath={`${basePath}/blog`} />
      <CategoriesClient categories={categories} projectId={siteId} />
    </div>
  )
}
