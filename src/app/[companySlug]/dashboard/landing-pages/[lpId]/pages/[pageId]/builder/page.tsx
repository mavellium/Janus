import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { BuilderWorkspace } from '@/components/builder/BuilderWorkspace'
import type { EditorNode } from '@/hooks/use-builder'

export const metadata = { title: 'Editor — Janus' }

export default async function LandingPageBuilderPage({
  params,
}: {
  params: Promise<{ companySlug: string; lpId: string; pageId: string }>
}) {
  const { companySlug, lpId, pageId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: lpId, deletedAt: null, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/landing-pages`)

  const page = await db.page.findUnique({
    where: { id: pageId, projectId: lpId, deletedAt: null },
  })
  if (!page) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const pageContent = page.content as any
  const initialContent: EditorNode[] = Array.isArray(pageContent?.nodes) ? pageContent.nodes : []
  const pageData = {
    nodes: initialContent,
    globalSettings: pageContent?.globalSettings || {
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
      projectId={lpId}
      projectType="LANDING_PAGE"
    />
  )
}
