import { AnalyticsDataTable, type AnalyticsTableColumn } from './AnalyticsDataTable'
import { MetricBar } from './MetricBar'
import type { TopPage } from '@/lib/analytics/ga4-client'

interface Props {
  pages: TopPage[]
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function TopPagesTable({ pages }: Props) {
  const maxViews = Math.max(1, ...pages.map((p) => p.views))

  const columns: AnalyticsTableColumn<TopPage>[] = [
    {
      key: 'path',
      label: 'Página',
      sortable: true,
      sortValue: (row) => row.path,
      render: (row) => <span className="truncate block max-w-xs">{row.path || '/'}</span>,
    },
    {
      key: 'views',
      label: 'Pageviews',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.views,
      render: (row) => <MetricBar value={row.views} max={maxViews} formatted={fmt(row.views)} />,
    },
    {
      key: 'visitors',
      label: 'Visitantes únicos',
      align: 'right',
      sortable: true,
      sortValue: (row) => row.visitors,
      render: (row) => fmt(row.visitors),
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-brand-text">
          Onde a atenção está sendo gasta?
        </h3>
        <p className="text-sm text-brand-muted">
          Páginas mais acessadas — clique no cabeçalho para ordenar
        </p>
      </div>
      <AnalyticsDataTable
        data={pages}
        columns={columns}
        defaultSortKey="views"
        getRowKey={(row, i) => `${row.path}-${i}`}
      />
    </div>
  )
}
