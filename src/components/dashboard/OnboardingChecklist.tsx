import Link from 'next/link'
import { CheckCircle2, Circle, ArrowRight, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OnboardingStep {
  key: string
  label: string
  description: string
  done: boolean
  href?: string
  ctaLabel?: string
  lockedMessage?: string
}

export function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((step) => step.done).length
  if (doneCount === steps.length) return null

  return (
    <div className="bg-card rounded-xl border border-brand-btn-light p-6 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-brand-primary" />
          <h3 className="text-lg font-semibold text-brand-text">Primeiros passos</h3>
        </div>
        <span className="text-xs font-semibold text-brand-muted">
          {doneCount} de {steps.length} concluídos
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-brand-btn-light/60 mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-primary transition-[width] duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-4">
        {steps.map((step) => (
          <li key={step.key} className="flex items-start gap-3">
            {step.done ? (
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            ) : (
              <Circle size={20} className="text-brand-muted flex-shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.done ? 'text-brand-muted line-through' : 'text-brand-text'
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-brand-muted mt-0.5">{step.description}</p>
              {!step.done && step.lockedMessage && (
                <p className="text-xs text-brand-muted italic mt-1">{step.lockedMessage}</p>
              )}
            </div>
            {!step.done && step.href && (
              <Link
                href={step.href}
                className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-brand-hover transition-colors mt-0.5"
              >
                {step.ctaLabel ?? 'Começar'}
                <ArrowRight size={12} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
