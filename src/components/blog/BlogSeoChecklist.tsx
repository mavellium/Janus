'use client'

import { useMemo } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { analyzeSeo, seoScore, type SeoInput } from '@/lib/seo-checklist'
import { cn } from '@/lib/utils'

export function BlogSeoChecklist({
  title,
  seoTitle,
  seoDescription,
  seoKeywords,
  body,
}: SeoInput) {
  const checks = useMemo(
    () => analyzeSeo({ title, seoTitle, seoDescription, seoKeywords, body }),
    [title, seoTitle, seoDescription, seoKeywords, body],
  )
  const score = seoScore(checks)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-text">
          Pontuação SEO
        </span>
        <span
          className={cn(
            'text-xs font-bold',
            score >= 80 ? 'text-brand-primary' : 'text-brand-muted',
          )}
        >
          {score}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-btn-light">
        <div
          className="h-full bg-brand-primary transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <ul className="mt-1 flex flex-col gap-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2 text-xs">
            {check.status === 'pass' ? (
              <Check size={14} className="mt-0.5 shrink-0 text-brand-primary" />
            ) : (
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-brand-cta" />
            )}
            <span className="flex-1">
              <span className="text-brand-text">{check.label}</span>
              <span className="block text-brand-muted">{check.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
