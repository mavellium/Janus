'use client'

import { useCountUp } from '@/components/seo/useCountUp'
import { useInView } from './useInView'
import { cn } from '@/lib/utils'

const PROVIDERS = ['OpenAI', 'Gemini', 'Perplexity']

const SHARE = [
  { name: 'Construtora Acme', share: 34, own: true },
  { name: 'Concorrente A', share: 41, own: false },
  { name: 'Concorrente B', share: 18, own: false },
  { name: 'Concorrente C', share: 7, own: false },
]

export function IagPanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const score = useCountUp(inView ? 62 : 0, 1100)

  return (
    <div
      ref={ref}
      className="lp-shadow-panel overflow-hidden rounded-2xl border border-brand-btn-light bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-btn-light px-4 py-3">
        <p className="lp-mono text-[10px] uppercase tracking-widest text-brand-muted">
          IAG Score
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROVIDERS.map((provider) => (
            <span
              key={provider}
              className="lp-tint-surface lp-mono rounded-md px-2 py-1 text-[10px] text-brand-muted"
            >
              {provider}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-3 px-4 pb-2 pt-5">
        <span className="lp-display text-5xl font-semibold tabular-nums leading-none text-brand-text">
          {score}
        </span>
        <span className="pb-1 text-sm text-brand-muted">de 100</span>
      </div>
      <p className="px-4 pb-5 text-sm text-brand-muted">
        Quanto maior, mais a sua marca aparece nas respostas. Pergunta de quem está prestes a
        contratar pesa mais que pergunta de quem só está pesquisando.
      </p>

      <div className="space-y-3 border-t border-brand-btn-light px-4 py-5">
        <p className="lp-mono text-[10px] uppercase tracking-widest text-brand-muted">
          Quem a IA cita
        </p>
        {SHARE.map((row, position) => (
          <div key={row.name} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  'truncate text-sm',
                  row.own ? 'font-medium text-brand-text' : 'text-brand-muted',
                )}
              >
                {row.name}
              </span>
              <span className="lp-mono shrink-0 text-xs tabular-nums text-brand-muted">
                {row.share}%
              </span>
            </div>
            <div className="lp-tint-track h-2 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-1000 ease-out',
                  row.own ? 'bg-brand-cta' : 'bg-brand-hover',
                )}
                style={{
                  width: inView ? `${row.share}%` : '0%',
                  transitionDelay: `${200 + position * 120}ms`,
                }}
              />
            </div>
          </div>
        ))}
        <p className="pt-1 text-xs text-brand-muted">Números ilustrativos.</p>
      </div>
    </div>
  )
}
