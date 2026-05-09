import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/prisma'
import { getProjects } from '@/modules/projects/queries/getProjects'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Landing Pages — Janus' }

export default async function LandingPagesPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const projects = await getProjects({ companyId: company.id, type: 'LANDING_PAGE' })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/${companySlug}/dashboard`} className="text-brand-primary hover:opacity-80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold" style={{ color: '#161718' }}>
              Landing Pages
            </h1>
          </div>
          <p className="text-sm text-brand-muted">
            {projects.length} landing {projects.length === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <button
          className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition"
          style={{ backgroundColor: '#161718' }}
        >
          Nova Landing Page
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-xl border border-brand-muted/40 overflow-hidden hover:shadow-lg transition"
          >
            <div className="h-32 bg-gradient-to-br from-blue-200 to-blue-300"></div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-1" style={{ color: '#161718' }}>
                {project.name}
              </h3>
              <p className="text-xs text-brand-muted mb-4">{formatDate(project.createdAt)}</p>
              <div className="mb-4 pb-4 border-b border-brand-muted/40">
                <p className="text-xs text-brand-muted">
                  {project._count.pages} {project._count.pages === 1 ? 'página' : 'páginas'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition"
                  style={{
                    color: '#161718',
                    backgroundColor: '#f5f5f5',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#ebe6da'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#f5f5f5'
                  }}
                >
                  Gerenciar
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white transition"
                  style={{ backgroundColor: '#514030' }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#7A614A'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#514030'
                  }}
                >
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2" style={{ color: '#161718' }}>
              Nenhuma landing page criada ainda
            </p>
            <p className="text-sm text-brand-muted mb-6">
              Comece criando sua primeira landing page
            </p>
            <button
              className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition"
              style={{ backgroundColor: '#161718' }}
            >
              Criar primeira landing page
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
