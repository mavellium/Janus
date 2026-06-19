import { AnalyticsDataTable, type AnalyticsTableColumn } from './AnalyticsDataTable'
import { MetricBar } from './MetricBar'
import type { TrafficSource } from '@/lib/analytics/ga4-client'

interface Props {
  sources: TrafficSource[]
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function TrafficSourceTable({ sources }: Props) {
  const maxSessions = Math.max(1, ...sources.map((s) => s.sessions))
  const top = sources[0]

  const columns: AnalyticsTableColumn<TrafficSource>[] = [
    {
      key: 'channel',
      label: 'Canal',
      sortable: true,
      sortValue: (row) => `${row.source}/${row.medium}`,
      render: (row) => (
        <span className="flex items-center gap-2">
          {row.source || '(direct)'} / {row.medium || '(none)'}
          {row === top && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[0.65rem] font-semibold">
              Nº1
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'sessions',
      label: 'Sessões',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.sessions,
      render: (row) => <MetricBar value={row.sessions} max={maxSessions} formatted={fmt(row.sessions)} />,
    },
    {
      key: 'newUsers',
      label: 'Novos usuários',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.newUsers,
      render: (row) => fmt(row.newUsers),
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-brand-text">
          De onde vem a maior parte da sua atenção?
        </h3>
        <p className="text-sm text-brand-muted">
          Tráfego por origem e mídia — clique no cabeçalho para ordenar
        </p>
      </div>
      <AnalyticsDataTable
        data={sources}
        columns={columns}
        defaultSortKey="sessions"
        getRowKey={(row, i) => `${row.source}-${row.medium}-${i}`}
      />
    </div>
  )
}
