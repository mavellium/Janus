'use client'

import { ScoreRing } from './ScoreRing'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function ScoreSlot({
  score,
  label,
  targetId,
}: {
  score: number | null
  label: string
  targetId?: string
}) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-1.5 opacity-40">
        <div className="w-28 h-28 rounded-full border-4 border-dashed border-brand-btn-light flex items-center justify-center">
          <span className="text-xs text-brand-muted">Indisponível</span>
        </div>
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{label}</span>
      </div>
    )
  }

  const ring = <ScoreRing score={score} size={112} label={label} />

  if (!targetId) return ring

  return (
    <button
      type="button"
      onClick={() => scrollToSection(targetId)}
      className="rounded-2xl transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
      title={`Ir para os resultados de ${label}`}
    >
      {ring}
    </button>
  )
}

export function CombinedScoreHeader({
  seoScore,
  geoScore,
  seoTargetId,
  geoTargetId,
}: {
  seoScore: number
  geoScore: number | null
  seoTargetId?: string
  geoTargetId?: string
}) {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-10 py-2 release-card-in">
      <ScoreSlot score={seoScore} label="SEO" targetId={seoTargetId} />
      <div className="w-px h-16 bg-brand-btn-light flex-shrink-0" />
      <ScoreSlot score={geoScore} label="GEO" targetId={geoTargetId} />
    </div>
  )
}
