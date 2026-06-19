interface Props {
  value: number
  max: number
  formatted: string
}

export function MetricBar({ value, max, formatted }: Props) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0

  return (
    <div className="flex items-center justify-end gap-2">
      <div className="hidden sm:block w-16 h-1.5 rounded-full bg-brand-btn-light overflow-hidden">
        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="font-medium text-brand-text tabular-nums">{formatted}</span>
    </div>
  )
}
