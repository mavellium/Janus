import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { IframePreview } from '@/components/schema-builder/IframePreview'
import { DynamicForm } from '@/components/schema-builder/DynamicForm'

export const metadata = { title: 'Editar Conteúdo — Janus' }

export default async function LandingPageContentEditPage({
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
    select: { id: true, name: true, schemaData: true, contentData: true, previewUrl: true },
  })
  if (!page) redirect(`/${companySlug}/dashboard/landing-pages/${lpId}/pages`)

  const backHref = `/${companySlug}/dashboard/landing-pages/${lpId}/pages`
  const previewUrl = page.previewUrl || project.previewUrl || ''

  return (
    <div className="flex w-full h-full overflow-hidden bg-brand-bg">
      <div className="w-1/3 border-r border-brand-btn-light h-full overflow-y-auto flex flex-col bg-sidebar-bg">
        <header className="flex items-center gap-3 px-6 py-4 border-b border-brand-btn-light shrink-0">
          <Link
            href={backHref}
            className="flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div className="h-5 w-px bg-brand-btn-light" />
          <div className="min-w-0">
            <p className="text-xs text-brand-muted">Editar Conteúdo</p>
            <h1 className="text-sm font-semibold text-brand-text truncate">{page.name}</h1>
          </div>
        </header>

        <div className="flex-1 min-h-0">
          <DynamicForm
            pageId={page.id}
            schemaData={page.schemaData}
            initialContentData={page.contentData}
          />
        </div>
      </div>

      <div className="w-2/3 h-full relative">
        <IframePreview url={previewUrl} />
      </div>
    </div>
  )
}
