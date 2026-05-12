import { db } from '@/lib/prisma'
import { redirect } from 'next/navigation'
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

  const isOwner = session?.user?.companySlug === companySlug

  if (!page.isPublished && !isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-brand-text">Página Privada</h1>
          <p className="text-brand-muted">Esta página ainda não foi publicada</p>
        </div>
      </div>
    )
  }

  const apiUrl = `/api/v1/content/${companySlug}/${page.slug}`

  return (
    <div className="h-screen overflow-y-auto bg-brand-bg text-brand-text">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Preview Headless</p>
          <h1 className="text-2xl font-bold text-brand-text mt-1">{page.name}</h1>
          <p className="text-sm text-brand-muted mt-2">
            Endpoint público:{' '}
            <code className="text-brand-primary">{apiUrl}</code>
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-semibold text-brand-muted mb-2">Schema</h2>
          <pre className="bg-card border border-brand-btn-light rounded-lg p-4 text-xs overflow-auto text-brand-text">
            {JSON.stringify(page.schemaData ?? {}, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-brand-muted mb-2">Content</h2>
          <pre className="bg-card border border-brand-btn-light rounded-lg p-4 text-xs overflow-auto text-brand-text">
            {JSON.stringify(page.contentData ?? {}, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  )
}
