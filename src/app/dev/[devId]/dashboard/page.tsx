import Link from 'next/link'
import { Building2, Users, ChevronRight, Globe, Activity, FolderKanban } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRecentCompanies } from '@/modules/dev/queries/getRecentCompanies'
import { getRecentUsers } from '@/modules/dev/queries/getRecentUsers'
import { getRecentProjects } from '@/modules/dev/queries/getRecentProjects'
import { getDevStats } from '@/modules/dev/queries/getDevStats'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Dev Dashboard — Janus' }

function formatRelative(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `${minutes}min atrás`
  if (hours < 24) return `${hours}h atrás`
  if (days === 1) return 'ontem'
  return `${days} dias atrás`
}

export default async function DevDashboardPage({
  params,
}: {
  params: Promise<{ devId: string }>
}) {
  const { devId } = await params

  const [stats, companies, users, projects] = await Promise.all([
    getDevStats(devId),
    getRecentCompanies(5),
    getRecentUsers(5),
    getRecentProjects(5),
  ])

  const lastActivity = projects[0]?.updatedAt

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text">Dev Dashboard</h1>
        <p className="text-sm text-brand-muted mt-1">Centro de comando — visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-muted">Empresas Ativas</CardTitle>
            <Building2 className="w-4 h-4 text-brand-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-text">{stats.totalCompanies}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-muted">Usuários Gerenciados</CardTitle>
            <Users className="w-4 h-4 text-brand-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-text">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-muted">Projetos no Ar</CardTitle>
            <Globe className="w-4 h-4 text-brand-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-text">{stats.totalProjects}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-brand-muted">Atividade Recente</CardTitle>
            <Activity className="w-4 h-4 text-brand-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-brand-text truncate">
              {lastActivity ? formatRelative(lastActivity) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-semibold text-brand-text">Últimos Projetos</h2>
          </div>
          <div className="divide-y divide-border">
            {projects.length === 0 && (
              <p className="p-5 text-sm text-brand-muted">Nenhum projeto encontrado.</p>
            )}
            {projects.map((project) => (
              <div key={project.id} className="p-4 hover:bg-brand-btn-light/30 transition">
                <p className="text-sm font-medium text-brand-text truncate">{project.name}</p>
                <p className="text-xs text-brand-muted mt-0.5">
                  <span className="text-brand-primary">{project.company.name}</span>
                  {' · '}
                  {formatRelative(project.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-semibold text-brand-text">Últimas Empresas</h2>
          </div>
          <div className="divide-y divide-border">
            {companies.length === 0 && (
              <p className="p-5 text-sm text-brand-muted">Nenhuma empresa cadastrada.</p>
            )}
            {companies.map((company) => (
              <div key={company.id} className="p-4 flex items-center justify-between hover:bg-brand-btn-light/30 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">{company.name}</p>
                  <p className="text-xs text-brand-muted">
                    <code className="text-brand-primary">{company.slug}</code>
                    {' · '}
                    {formatDate(company.createdAt)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Link
              href={`/dev/${devId}/dashboard/companies`}
              className="text-sm font-medium text-brand-primary hover:opacity-80 transition"
            >
              Ver todas →
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-primary" />
            <h2 className="text-sm font-semibold text-brand-text">Últimos Usuários</h2>
          </div>
          <div className="divide-y divide-border">
            {users.length === 0 && (
              <p className="p-5 text-sm text-brand-muted">Nenhum usuário cadastrado.</p>
            )}
            {users.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-brand-btn-light/30 transition">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">{user.name || user.email}</p>
                  <p className="text-xs text-brand-muted truncate">
                    {user.email}
                    {user.company && (
                      <> · <span className="text-brand-primary">{user.company.name}</span></>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Link
              href={`/dev/${devId}/dashboard/users`}
              className="text-sm font-medium text-brand-primary hover:opacity-80 transition"
            >
              Ver todos →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
