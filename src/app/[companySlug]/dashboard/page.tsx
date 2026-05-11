import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, Globe, ChevronRight } from 'lucide-react'
import { db } from '@/lib/prisma'
import { getProjects } from '@/modules/projects/queries/getProjects'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Dashboard — Janus' }

export default async function DashboardPage({
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

  const [institutionalProjects, landingPageProjects] = await Promise.all([
    getProjects({ companyId: company.id, type: 'INSTITUTIONAL' }),
    getProjects({ companyId: company.id, type: 'LANDING_PAGE' }),
  ])

  const firstName = session.user.email?.split('@')[0] || 'Usuário'
  const totalInstitutional = institutionalProjects.length
  const totalLandingPages = landingPageProjects.length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-brand-text">
          Boas-vindas ao Janus, {firstName}!
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-muted">Seus projetos</span>
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold text-white bg-destructive"
          >
            {totalInstitutional + totalLandingPages}
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden mb-8 bg-brand-btn-dark">
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Transforme sua ideia em um site ou landing page — em minutos
            </h2>
            <p className="text-white/70 text-sm mb-6">
              Converse com IA pública ou comum clique aqui
            </p>
            <button className="px-6 py-2 bg-brand-bg text-brand-text text-sm font-semibold rounded-lg hover:opacity-80 transition">
              Começar
            </button>
          </div>
          <div className="hidden md:block w-48 h-40 bg-brand-btn-light/30 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-xl border border-brand-btn-light">
          <div className="p-6 border-b border-brand-btn-light">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-semibold text-brand-text">
                Sites
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-brand-muted text-xs mb-1">Total</p>
                <p className="font-semibold text-brand-text">
                  {totalInstitutional}
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Ativos</p>
                <p className="font-semibold text-brand-text">
                  {totalInstitutional}
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Páginas</p>
                <p className="font-semibold text-brand-text">
                  {institutionalProjects.reduce((sum, p) => sum + p._count.pages, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-brand-btn-light">
            {institutionalProjects.slice(0, 2).map((project) => (
              <div
                key={project.id}
                className="p-4 flex items-center justify-between hover:bg-brand-btn-light/40 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded bg-brand-btn-light"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-brand-muted">{formatDate(project.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${companySlug}/dashboard/sites/${project.id}/pages`}
                    className="px-3 py-1 text-xs border border-brand-btn-light rounded-lg hover:bg-brand-btn-light/40 transition text-brand-text"
                  >
                    Gerenciar
                  </Link>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </div>
              </div>
            ))}
            {institutionalProjects.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-brand-muted">Nenhum site criado ainda</p>
              </div>
            )}
            <div className="p-4 text-center">
              <Link
                href={`/${companySlug}/dashboard/sites`}
                className="text-sm font-semibold text-brand-primary hover:opacity-80 transition"
              >
                Gerenciar todos →
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-brand-btn-light">
          <div className="p-6 border-b border-brand-btn-light">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-semibold text-brand-text">
                Landing Pages
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-brand-muted text-xs mb-1">Total</p>
                <p className="font-semibold text-brand-text">
                  {totalLandingPages}
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Ativos</p>
                <p className="font-semibold text-brand-text">
                  {totalLandingPages}
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Páginas</p>
                <p className="font-semibold text-brand-text">
                  {landingPageProjects.reduce((sum, p) => sum + p._count.pages, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-brand-btn-light">
            {landingPageProjects.slice(0, 2).map((project) => (
              <div
                key={project.id}
                className="p-4 flex items-center justify-between hover:bg-brand-btn-light/40 transition"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded bg-brand-btn-light"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-brand-muted">{formatDate(project.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${companySlug}/dashboard/landing-pages/${project.id}/pages`}
                    className="px-3 py-1 text-xs border border-brand-btn-light rounded-lg hover:bg-brand-btn-light/40 transition text-brand-text"
                  >
                    Gerenciar
                  </Link>
                  <ChevronRight className="w-4 h-4 text-brand-muted" />
                </div>
              </div>
            ))}
            {landingPageProjects.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-brand-muted">Nenhuma landing page criada ainda</p>
              </div>
            )}
            <div className="p-4 text-center">
              <Link
                href={`/${companySlug}/dashboard/landing-pages`}
                className="text-sm font-semibold text-brand-primary hover:opacity-80 transition"
              >
                Gerenciar todos →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
