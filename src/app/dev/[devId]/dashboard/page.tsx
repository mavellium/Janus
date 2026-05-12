import Link from 'next/link'
import { Building2, Users, ChevronRight } from 'lucide-react'
import { getRecentCompanies } from '@/modules/dev/queries/getRecentCompanies'
import { getRecentUsers } from '@/modules/dev/queries/getRecentUsers'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Dev Dashboard — Janus' }

export default async function DevDashboardPage({
  params,
}: {
  params: Promise<{ devId: string }>
}) {
  const { devId } = await params
  const [companies, users] = await Promise.all([
    getRecentCompanies(3),
    getRecentUsers(3),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text">Dev Dashboard</h1>
        <p className="text-sm text-brand-muted mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-primary" />
              <h2 className="text-sm font-semibold text-brand-text">Últimas Empresas</h2>
            </div>
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
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" />
              <h2 className="text-sm font-semibold text-brand-text">Últimos Usuários</h2>
            </div>
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
