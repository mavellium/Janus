import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { SchemaBuilderEditor } from '@/components/schema-builder/SchemaBuilderEditor'
import { headers } from 'next/headers'
import { hasPermission } from '@/lib/auth/permissions'
import { getUserPermissions } from '@/modules/auth/queries/getUserPermissions'
import { unstable_noStore } from 'next/cache'

export const metadata = { title: 'Construir — Janus' }

export default async function LandingPageSchemaBuilderPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string; pageId: string }>
}) {
  unstable_noStore()
  const { companySlug, lpId, pageId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const freshPermissions = await getUserPermissions(session.user.id)
  const sessionWithFreshPerms = {
    ...session,
    user: {
      ...session.user,
      permissions: freshPermissions,
    },
  }

  const canBuild = hasPermission(sessionWithFreshPerms, 'PAGE_BUILD', 'landingPages', 'page')
  if (!canBuild) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: lpId, deletedAt: null, companyId: company.id },
    select: { id: true, previewUrl: true },
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages`)

  const page = await db.page.findUnique({
    where: { id: pageId, projectId: lpId, deletedAt: null },
    select: { id: true, name: true, slug: true, schemaData: true, isPublished: true },
  })
  if (!page) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const rawSlug = (page.slug ?? '').trim()
  const pageSlug = rawSlug === '/' || !rawSlug ? 'home' : rawSlug
  const apiUrl = `${protocol}://${host}/api/v1/content/${companySlug}/${pageSlug}`

  return (
    <SchemaBuilderEditor
      pageId={page.id}
      pageName={page.name}
      backHref={`/${companySlug}/dashboard/landing-pages/${lpId}/pages`}
      initialSchema={page.schemaData}
      initialPublished={page.isPublished}
      previewHref={`/${companySlug}/dashboard/landing-pages/${lpId}/pages/${pageId}/edit`}
      apiUrl={apiUrl}
    />
  )
}
