import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { SiteContentEditClient } from '@/components/schema-builder/SiteContentEditClient'
import { unstable_noStore } from 'next/cache'
import { checkPermission } from '@/lib/auth/permissions'

export const metadata = { title: 'Editar Conteúdo — Janus' }

export default async function SiteContentEditPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; pageId: string }>
}) {
  unstable_noStore()
  const { companySlug, siteId, pageId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites`)

  const page = await db.page.findUnique({
    where: { id: pageId, projectId: siteId, deletedAt: null },
    select: { id: true, name: true, schemaData: true, contentData: true, isAdvanced: true, previewUrl: true },
  })
  if (!page) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const canBuild = await checkPermission(session, 'PAGE_BUILD', 'sites', 'page')
  const builderHref = canBuild ? `/${companySlug}/dashboard/sites/${siteId}/pages/${pageId}/builder` : undefined

  const backHref = `/${companySlug}/dashboard/sites/${siteId}/pages`
  const previewUrl = page.previewUrl || project.previewUrl || ''

  return (
    <SiteContentEditClient
      pageId={page.id}
      pageName={page.name}
      schemaData={page.schemaData}
      initialContentData={page.contentData}
      isAdvanced={page.isAdvanced}
      previewUrl={previewUrl}
      backHref={backHref}
      builderHref={builderHref}
    />
  )
}
