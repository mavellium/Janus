'use client'

import { Check, X } from 'lucide-react'
import { ScoreRing } from '@/components/seo/ScoreRing'
import { useInView } from './useInView'
import { cn } from '@/lib/utils'

const CHECKS = [
  { label: 'Título da página', passed: true },
  { label: 'Meta descrição', passed: true },
  { label: 'Cabeçalho principal (H1)', passed: true },
  { label: 'Compatibilidade mobile (viewport)', passed: true },
  { label: 'Texto alternativo em imagens', passed: false },
  { label: 'Dados estruturados de Perguntas Frequentes', passed: false },
]

export function ScorePanel() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3)

  return (
    <div
      ref={ref}
      className="lp-shadow-panel overflow-hidden rounded-2xl border border-brand-btn-light bg-card"
    >
      <div className="flex items-center gap-2 border-b border-brand-btn-light px-4 py-3">
        <span className="lp-mono truncate text-xs text-brand-muted">
          https://construtora-acme.com.br
        </span>
      </div>

      <div className="flex items-center justify-center gap-6 px-4 py-6 sm:gap-14 sm:py-7">
        {inView ? (
          <>
            <ScoreRing score={92} size={104} label="SEO" />
            <ScoreRing score={67} size={104} label="GEO" />
          </>
        ) : (
          <>
            <div className="h-[104px] w-[104px] rounded-full border-8 border-brand-btn-light" />
            <div className="h-[104px] w-[104px] rounded-full border-8 border-brand-btn-light" />
          </>
        )}
      </div>

      <ul className="divide-y divide-brand-btn-light border-t border-brand-btn-light">
        {CHECKS.map((check, position) => (
          <li
            key={check.label}
            className={cn(
              'flex items-start gap-3 px-4 py-2.5 transition-all duration-500 ease-out',
              inView ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0',
            )}
            style={{ transitionDelay: `${400 + position * 90}ms` }}
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                check.passed ? 'lp-tint-primary' : 'lp-tint-cta',
              )}
            >
              {check.passed ? (
                <Check size={12} className="text-brand-primary" />
              ) : (
                <X size={12} className="text-brand-cta" />
              )}
            </span>
            <span
              className={cn(
                'text-sm',
                check.passed ? 'text-brand-muted' : 'font-medium text-brand-text',
              )}
            >
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
