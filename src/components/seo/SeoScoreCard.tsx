import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SEVERITY_LABELS,
  SEVERITY_ORDER,
  type SeoCheckResult,
} from '@/modules/seo/domain/seoCheck'

function scoreColor(score: number): string {
  if (score < 50) return 'text-red-500'
  if (score < 80) return 'text-amber-500'
  return 'text-emerald-500'
}

function scoreStroke(score: number): string {
  if (score < 50) return 'stroke-red-500'
  if (score < 80) return 'stroke-amber-500'
  return 'stroke-emerald-500'
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const progress = circumference * (1 - score / 100)

  return (
    <div className="relative w-32 h-32 flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          className="stroke-brand-btn-light"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', scoreStroke(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-3xl font-bold', scoreColor(score))}>{score}</span>
        <span className="text-[10px] text-brand-muted uppercase tracking-wide">de 100</span>
      </div>
    </div>
  )
}

function CheckItem({ check, showPoints }: { check: SeoCheckResult; showPoints: boolean }) {
  return (
    <li className="flex items-start gap-2.5 py-2">
      {check.passed ? (
        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-brand-text">{check.label}</span>
          {!check.passed && (
            <span
              className={cn(
                'text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5',
                check.severity === 'critical' && 'bg-red-500/10 text-red-500',
                check.severity === 'important' && 'bg-amber-500/10 text-amber-600',
                check.severity === 'minor' && 'bg-brand-btn-light text-brand-muted'
              )}
            >
              {SEVERITY_LABELS[check.severity]}
            </span>
          )}
          {showPoints && (
            <span className="text-xs text-brand-muted ml-auto">
              {check.points}/{check.maxPoints} pts
            </span>
          )}
        </div>
        <p className="text-xs text-brand-muted mt-0.5">{check.message}</p>
        {check.recommendation && (
          <p className="text-xs text-brand-text mt-1 bg-brand-btn-light/40 rounded-lg px-2.5 py-1.5">
            {check.recommendation}
          </p>
        )}
      </div>
    </li>
  )
}

export function SeoScoreCard({
  score,
  checks,
  expanded = false,
}: {
  score: number
  checks: SeoCheckResult[]
  expanded?: boolean
}) {
  const failed = [...checks]
    .filter((check) => !check.passed)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
  const passed = checks.filter((check) => check.passed)

  const visibleFailed = expanded ? failed : failed.slice(0, 5)
  const hiddenFailedCount = failed.length - visibleFailed.length

  return (
    <div>
      <div className="flex items-center gap-5 mb-4">
        <ScoreRing score={score} />
        <div>
          <p className="text-sm font-semibold text-brand-text">
            {score >= 80 && 'Ótimo! Seu site está bem otimizado.'}
            {score >= 50 && score < 80 && 'Bom começo — mas há pontos importantes a melhorar.'}
            {score < 50 && 'Seu site precisa de atenção: há problemas críticos de SEO.'}
          </p>
          <p className="text-xs text-brand-muted mt-1">
            {failed.length === 0
              ? 'Todos os critérios avaliados foram aprovados.'
              : `${failed.length} de ${checks.length} critérios precisam de ajuste.`}
          </p>
        </div>
      </div>

      {visibleFailed.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1">
            Ações necessárias
          </h4>
          <ul className="divide-y divide-brand-btn-light/60">
            {visibleFailed.map((check) => (
              <CheckItem key={check.key} check={check} showPoints={expanded} />
            ))}
          </ul>
          {hiddenFailedCount > 0 && (
            <p className="text-xs text-brand-muted mt-1">
              + {hiddenFailedCount} outro(s) ajuste(s) no relatório completo.
            </p>
          )}
        </div>
      )}

      {passed.length > 0 && (
        <div>
          {expanded ? (
            <>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-muted mb-1">
                Critérios aprovados
              </h4>
              <ul className="divide-y divide-brand-btn-light/60">
                {passed.map((check) => (
                  <CheckItem key={check.key} check={check} showPoints />
                ))}
              </ul>
            </>
          ) : (
            <p className="text-xs text-brand-muted">
              ✓ {passed.length} critério(s) já aprovados.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
