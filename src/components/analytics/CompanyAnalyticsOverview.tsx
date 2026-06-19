import { Eye, Users, Activity, AlertTriangle, BarChart3 } from 'lucide-react'
import { getCompanyAnalytics } from '@/modules/analytics/queries/getCompanyAnalytics'
import { KpiCard } from './KpiCard'
import { AnalyticsAreaChart } from './AnalyticsAreaChart'

interface Props {
  projectPropertyIds: string[]
}

export async function CompanyAnalyticsOverview({ projectPropertyIds }: Props) {
  const result = await getCompanyAnalytics(projectPropertyIds, 30)

  if (result.ok && !result.configured) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-text">Panorama Geral</h2>
        <div className="bg-card rounded-xl border border-brand-btn-light p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <BarChart3 className="h-6 w-6" />
            </span>
            <p className="text-sm text-brand-muted max-w-sm">
              Nenhum projeto com Google Analytics configurado ainda. Configure o GA4 nos
              resultados de cada site ou landing page para ver o panorama consolidado.
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (!result.ok || !result.data) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-text">Panorama Geral</h2>
        <div className="bg-card rounded-xl border border-brand-btn-light p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <p className="text-sm text-brand-muted max-w-sm">
              {result.error ?? 'Não foi possível carregar o panorama'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  const { totals, series } = result.data

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-brand-text">Panorama Geral</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <KpiCard label="Total de Visitas" value={totals.views} icon={Eye} />
        <KpiCard label="Usuários Únicos" value={totals.visitors} icon={Users} />
        <KpiCard label="Sessões" value={totals.sessions} icon={Activity} />
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
        <div className="mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-brand-text">
            Evolução (últimos 30 dias)
          </h3>
          <p className="text-sm text-brand-muted">Consolidado de todos os projetos</p>
        </div>
        {series.length > 0 ? (
          <AnalyticsAreaChart data={series} />
        ) : (
          <div className="flex items-center justify-center h-72">
            <p className="text-sm text-brand-muted">Sem dados no período selecionado</p>
          </div>
        )}
      </div>
    </section>
  )
}
