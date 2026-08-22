import { AlertTriangle, Gauge } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLAN_CATALOG, formatLimitValue } from '@/modules/billing/domain/plans'
import type { EffectiveSubscription } from '@/modules/billing/domain/limits'
import type { CompanyUsage } from '@/modules/billing/queries/getCompanyUsage'

interface PlanUsageCardProps {
  subscription: EffectiveSubscription
  usage: CompanyUsage
}

interface UsageRow {
  label: string
  used: number
  limit: number | null
}

function UsageBar({ row }: { row: UsageRow }) {
  const limit = row.limit
  const unlimited = limit === null
  const pct = limit === null || limit === 0 ? 0 : Math.min(100, (row.used / limit) * 100)
  const exhausted = limit !== null && row.used >= limit

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{row.label}</span>
        <span className={cn('font-medium tabular-nums', exhausted && 'text-destructive')}>
          {row.used}
          <span className="text-muted-foreground"> / {formatLimitValue(row.limit)}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            exhausted ? 'bg-destructive' : pct >= 80 ? 'bg-amber-500' : 'bg-primary',
          )}
          style={{ width: unlimited ? '100%' : `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function PlanUsageCard({ subscription, usage }: PlanUsageCardProps) {
  const plan = PLAN_CATALOG[subscription.tier]
  const { limits } = subscription

  const rows: UsageRow[] = [
    { label: 'Sites e landing pages', used: usage.projects, limit: limits.projects },
    { label: 'Usuários', used: usage.users, limit: limits.users },
    { label: 'Raio-X neste mês', used: usage.geoRunsThisMonth, limit: limits.geoRunsPerMonth },
  ]

  const trialWarning =
    subscription.trialDaysLeft !== null && subscription.trialDaysLeft > 0
      ? `Teste grátis termina em ${subscription.trialDaysLeft} dia(s).`
      : null

  return (
    <section className="rounded-xl border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-medium">Plano {plan.name}</h2>
        </div>
        {subscription.discountActive && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {subscription.discountPercent}% off
          </span>
        )}
      </header>

      {subscription.locked && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Assinatura inativa. O conteúdo publicado continua no ar, mas não é possível criar
          novos itens até regularizar.
        </p>
      )}

      {!subscription.locked && trialWarning && (
        <p className="mt-3 rounded-lg bg-blue-500/10 p-3 text-sm text-blue-600 dark:text-blue-400">
          {trialWarning}
        </p>
      )}

      <div className="mt-4 space-y-3.5">
        {rows.map((row) => (
          <UsageBar key={row.label} row={row} />
        ))}
      </div>
    </section>
  )
}
