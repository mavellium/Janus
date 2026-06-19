import { AnalyticsDataTable, type AnalyticsTableColumn } from './AnalyticsDataTable'
import { MetricBar } from './MetricBar'
import type { ChannelConversion } from '@/lib/analytics/ga4-client'

interface Props {
  channels: ChannelConversion[]
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function ChannelConversionTable({ channels }: Props) {
  const maxSessions = Math.max(1, ...channels.map((c) => c.sessions))

  const columns: AnalyticsTableColumn<ChannelConversion>[] = [
    {
      key: 'channel',
      label: 'Canal',
      sortable: true,
      sortValue: (row) => row.channel,
      render: (row) => row.channel || '—',
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
      key: 'conversions',
      label: 'Conversões',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.conversions,
      render: (row) => fmt(row.conversions),
    },
    {
      key: 'rate',
      label: 'Taxa',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.rate,
      render: (row) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-brand-btn-light text-xs font-medium text-brand-text">
          {row.rate}%
        </span>
      ),
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-brand-text">
          Qual canal converte melhor, não só traz mais gente?
        </h3>
        <p className="text-sm text-brand-muted">
          Taxa de conversão por canal — clique no cabeçalho para ordenar
        </p>
      </div>
      <AnalyticsDataTable
        data={channels}
        columns={columns}
        defaultSortKey="sessions"
        getRowKey={(row) => row.channel}
      />
    </div>
  )
}
