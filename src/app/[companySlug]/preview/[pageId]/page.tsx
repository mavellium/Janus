import { db } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { CoreRenderer } from '@/components/builder/CoreRenderer'
import type { EditorNode } from '@/hooks/use-builder'
import { auth } from '@/lib/auth'

export const metadata = { title: 'Preview — Janus' }

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ companySlug: string; pageId: string }>
}) {
  const { companySlug, pageId } = await params
  const session = await auth()

  const page = await db.page.findUnique({
    where: { id: pageId, deletedAt: null },
    include: { project: { include: { company: true } } },
  })

  if (!page) {
    redirect('/404')
  }

  if (page.project.company.slug !== companySlug) {
    redirect('/404')
  }

  const pageData = page as typeof page & { isPublished?: boolean }
  const isOwner = session?.user?.companySlug === companySlug

  if (!pageData.isPublished && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#161718' }}>
            Página Privada
          </h1>
          <p className="text-brand-muted">Esta página ainda não foi publicada</p>
        </div>
      </div>
    )
  }

  const content = page.content as { nodes?: EditorNode[]; globalSettings?: { backgroundColor?: string; textColor?: string; fontFamily?: string } } | undefined
  const nodes = content?.nodes || []
  const globalSettings = content?.globalSettings || {}

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: globalSettings.backgroundColor || '#F5F5F5',
        color: globalSettings.textColor || '#161718',
        fontFamily: globalSettings.fontFamily || 'Inter, sans-serif',
      }}
    >
      {nodes.map((node) => (
        <CoreRenderer key={node.id} node={node} />
      ))}
    </div>
  )
}
