import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  index: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  className?: string
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <div className="mb-5 flex items-center gap-3">
        <span className="lp-mono text-xs text-brand-cta">{index}</span>
        <span className="h-px w-6 bg-brand-btn-light" />
        <span className="lp-mono text-[10px] uppercase tracking-[0.18em] text-brand-muted">
          {eyebrow}
        </span>
      </div>
      <h2 className="lp-display text-[1.75rem] font-semibold leading-[1.2] tracking-tight text-brand-text sm:text-3xl sm:leading-[1.15] lg:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[0.95rem] leading-relaxed text-brand-muted sm:text-base lg:text-lg">
          {description}
        </p>
      )}
    </div>
  )
}
