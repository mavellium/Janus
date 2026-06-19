'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AnalyticsPoint } from '@/lib/analytics/ga4-client'

interface Props {
  data: AnalyticsPoint[]
}

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(d)
}

export function AnalyticsAreaChart({ data }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    label: formatDayLabel(point.date),
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="ga4Views" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand-cta)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--brand-cta)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ga4Visitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--brand-btn-light)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--brand-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--brand-btn-light)' }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: 'var(--brand-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--brand-btn-light)',
              borderRadius: '0.75rem',
              color: 'var(--brand-text)',
            }}
            labelStyle={{ color: 'var(--brand-muted)' }}
          />
          <Area
            type="monotone"
            dataKey="views"
            name="Visualizações"
            stroke="var(--brand-cta)"
            strokeWidth={2}
            fill="url(#ga4Views)"
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Visitantes"
            stroke="var(--brand-primary)"
            strokeWidth={2}
            fill="url(#ga4Visitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
