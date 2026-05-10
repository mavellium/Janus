import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { BuilderWorkspace } from '@/components/builder/BuilderWorkspace'
import type { EditorNode } from '@/hooks/use-builder'

export const metadata = { title: 'Editor — Janus' }

export default async function SiteBuilderPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; pageId: string }>
}) {
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
  })
  if (!page) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  const pageContent = page.content as unknown
  const initialContent: EditorNode[] = Array.isArray((pageContent as any)?.nodes) ? (pageContent as any).nodes : []
  const pageData = {
    nodes: initialContent,
    globalSettings: (pageContent as any)?.globalSettings || {
      backgroundColor: '#F5F5F5',
      textColor: '#161718',
      fontFamily: 'Inter',
    }
  }

  return (
    <BuilderWorkspace
      companySlug={companySlug}
      initialData={pageData}
      pageId={pageId}
      projectId={siteId}
      projectType="INSTITUTIONAL"
    />
  )
}
