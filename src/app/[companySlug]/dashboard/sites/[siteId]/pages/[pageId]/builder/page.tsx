import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { SchemaBuilderEditor } from '@/components/schema-builder/SchemaBuilderEditor'
import { headers } from 'next/headers'

export const metadata = { title: 'Construir — Janus' }

export default async function SiteSchemaBuilderPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; pageId: string }>
}) {
  const { companySlug, siteId, pageId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'DEVELOPER') redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null, companyId: company.id },
    select: { id: true, previewUrl: true },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites`)

  const page = await db.page.findUnique({
    where: { id: pageId, projectId: siteId, deletedAt: null },
    select: { id: true, name: true, slug: true, schemaData: true, isPublished: true },
  })
  if (!page) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const apiUrl = `${protocol}://${host}/api/v1/content/${companySlug}/${page.slug}`

  return (
    <SchemaBuilderEditor
      pageId={page.id}
      pageName={page.name}
      backHref={`/${companySlug}/dashboard/sites/${siteId}/pages`}
      initialSchema={page.schemaData}
      initialPublished={page.isPublished}
      previewHref={`/${companySlug}/dashboard/sites/${siteId}/pages/${pageId}/edit`}
      apiUrl={apiUrl}
    />
  )
}
