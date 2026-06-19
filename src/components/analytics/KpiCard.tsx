import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: number
  icon: LucideIcon
}

export function KpiCard({ label, value, icon: Icon }: KpiCardProps) {
  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-brand-muted">{label}</span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-brand-text">
        {new Intl.NumberFormat('pt-BR').format(value)}
      </p>
    </div>
  )
}
