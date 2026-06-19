import { ArrowUp, ArrowDown, ChevronRight, Users, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FunnelMetrics } from '@/lib/analytics/ga4-client'

interface Props {
  funnel: FunnelMetrics
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

function dropOff(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round((current / previous - 1) * 100)
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        positive ? 'text-green-600 dark:text-green-400' : 'text-destructive',
      )}
    >
      {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  )
}

function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function FunnelCard({ funnel }: Props) {
  const { current, previous } = funnel

  const stages = [
    { key: 'visitors', label: 'Visitantes', icon: Users, value: current.visitors, prevValue: previous.visitors },
    { key: 'engaged', label: 'Engajados', icon: Sparkles, value: current.engaged, prevValue: previous.engaged },
    { key: 'converted', label: 'Convertidos', icon: Zap, value: current.converted, prevValue: previous.converted },
  ]

  const total = current.visitors || 1

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-brand-text">
          Onde o funil está vazando?
        </h3>
        <p className="text-sm text-brand-muted">
          Visitantes → Engajados → Convertidos — últimos 7 dias
        </p>
      </div>

      <div className="flex items-stretch gap-1 sm:gap-3">
        {stages.map((stage, i) => {
          const Icon = stage.icon
          const change = pctChange(stage.value, stage.prevValue)
          const pctOfTotal = Math.round((stage.value / total) * 100)
          const drop = i > 0 ? dropOff(stage.value, stages[i - 1].value) : null

          return (
            <div key={stage.key} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-bold text-brand-text">{fmt(stage.value)}</p>
                <ChangeBadge value={change} />
                <p className="text-xs text-brand-muted mt-1">{pctOfTotal}% do total</p>
              </div>

              {i < stages.length - 1 && (
                <div className="flex flex-col items-center justify-center px-1 sm:px-2 shrink-0">
                  <ChevronRight className="h-4 w-4 text-brand-muted" />
                  {drop !== null && (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        drop >= 0 ? 'text-green-600 dark:text-green-400' : 'text-brand-muted',
                      )}
                    >
                      {drop > 0 ? '+' : ''}
                      {drop}%
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
