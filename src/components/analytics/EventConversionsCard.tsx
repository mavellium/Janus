'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { EventConversion } from '@/lib/analytics/ga4-client'

interface Props {
  events: EventConversion[]
}

type SortMode = 'desc' | 'asc' | 'alpha'

const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'desc', label: 'Mais conversões' },
  { mode: 'asc', label: 'Menos conversões' },
  { mode: 'alpha', label: 'A → Z' },
]

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function EventConversionsCard({ events }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>('desc')

  const sorted = [...events].sort((a, b) => {
    if (sortMode === 'alpha') return a.eventName.localeCompare(b.eventName)
    if (sortMode === 'asc') return a.conversions - b.conversions
    return b.conversions - a.conversions
  })

  const maxConversions = Math.max(1, ...events.map((e) => e.conversions))

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-brand-text">
            Quais ações geram resultado real?
          </h3>
          <p className="text-sm text-brand-muted">Conversões por evento — últimos 7 dias</p>
        </div>
        <div className="inline-flex rounded-lg border border-brand-btn-light p-0.5 self-start">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setSortMode(opt.mode)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition whitespace-nowrap',
                sortMode === opt.mode
                  ? 'bg-brand-cta text-white'
                  : 'text-brand-muted hover:text-brand-text',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-brand-muted text-center py-8">
          Nenhum evento de conversão configurado no GA4
        </p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((event) => (
            <div key={event.eventName} className="flex items-center gap-3">
              <span className="text-sm text-brand-text w-40 truncate shrink-0">{event.eventName}</span>
              <div className="flex-1 h-2 rounded-full bg-brand-btn-light overflow-hidden">
                <div
                  className="h-full bg-brand-cta rounded-full"
                  style={{ width: `${Math.max(4, Math.round((event.conversions / maxConversions) * 100))}%` }}
                />
              </div>
              <span className="text-sm font-medium text-brand-text w-10 text-right tabular-nums">
                {fmt(event.conversions)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
