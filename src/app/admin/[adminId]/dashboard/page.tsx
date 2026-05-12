import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminStats } from '@/modules/admin/queries/getAdminStats'
import { getAdminCompanies } from '@/modules/admin/queries/getAdminCompanies'
import { getAdminUsers } from '@/modules/admin/queries/getAdminUsers'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, Code2, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ adminId: string }>
}) {
  const { adminId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [stats, companies, users] = await Promise.all([
    getAdminStats(),
    getAdminCompanies(),
    getAdminUsers(),
  ])

  const METRICS = [
    { label: 'Usuários', value: stats.usersCount, icon: Users, href: `/admin/${adminId}/dashboard/users` },
    { label: 'Desenvolvedores', value: stats.developersCount, icon: Code2, href: `/admin/${adminId}/dashboard/developers` },
    { label: 'Empresas', value: stats.companiesCount, icon: Building2, href: `/admin/${adminId}/dashboard/companies` },
    { label: 'IPs Bloqueados', value: stats.blockedCount, icon: Shield, href: `/admin/${adminId}/dashboard/logs` },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-text">Admin Panel</h1>
        <p className="text-sm text-brand-muted mt-1">Visão global do sistema</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {METRICS.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="bg-card hover:border-brand-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</span>
                  <Icon className="w-4 h-4 text-brand-primary" />
                </div>
                <p className="text-3xl font-bold text-brand-text">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-brand-text">Últimas Empresas</h2>
            <Link href={`/admin/${adminId}/dashboard/companies`} className="text-xs text-brand-primary hover:underline">
              Ver todas
            </Link>
          </div>
          {companies.slice(0, 5).length === 0 ? (
            <div className="py-10 text-center text-sm text-brand-muted">Nenhuma empresa cadastrada</div>
          ) : (
            <ul className="divide-y divide-border">
              {companies.slice(0, 5).map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{c.name}</p>
                    <code className="text-xs text-brand-primary">{c.slug}</code>
                  </div>
                  <span className="text-xs text-brand-muted">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-brand-text">Últimos Usuários</h2>
            <Link href={`/admin/${adminId}/dashboard/users`} className="text-xs text-brand-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {users.slice(0, 5).length === 0 ? (
            <div className="py-10 text-center text-sm text-brand-muted">Nenhum usuário cadastrado</div>
          ) : (
            <ul className="divide-y divide-border">
              {users.slice(0, 5).map((u) => (
                <li key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-text">{u.name || u.email}</p>
                    <p className="text-xs text-brand-muted">{u.email}</p>
                  </div>
                  <span className="text-xs text-brand-muted">
                    {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
