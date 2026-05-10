import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/prisma'
import { getPagesByProjectId } from '@/modules/projects/queries/getPagesByProjectId'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Páginas — Janus' }

export default async function SitePagesPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
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

  const pages = await getPagesByProjectId(siteId)

  return (
    <div className="p-8 w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#161718' }}>
            Páginas
          </h1>
          <p className="text-sm text-brand-muted">
            {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
          </p>
        </div>
        <button
          className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition"
          style={{ backgroundColor: '#514030' }}
        >
          Nova Página
        </button>
      </div>

      <div className="bg-white rounded-xl border border-brand-muted/40 overflow-hidden">
        <div className="divide-y divide-brand-muted/40">
          {pages.map((page) => (
            <div
              key={page.id}
              className="p-6 flex items-center justify-between hover:bg-brand-muted/10 transition"
            >
              <div className="flex-1">
                <h3 className="text-base font-semibold" style={{ color: '#161718' }}>
                  {page.name}
                </h3>
                <p className="text-xs text-brand-muted mt-1">/{page.slug}</p>
                <p className="text-xs text-brand-muted mt-2">{formatDate(page.createdAt)}</p>
              </div>
              <Link
                href={`/${companySlug}/dashboard/sites/${siteId}/pages/${page.id}/builder`}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition"
                style={{ backgroundColor: '#514030' }}
              >
                Editar
              </Link>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-brand-muted mb-4">Nenhuma página criada ainda</p>
            <button
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition"
              style={{ backgroundColor: '#514030' }}
            >
              Criar primeira página
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
