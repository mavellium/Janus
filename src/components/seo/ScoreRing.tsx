'use client'

import { cn } from '@/lib/utils'
import { useCountUp } from './useCountUp'

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

export function ScoreRing({
  score,
  size = 128,
  label,
}: {
  score: number
  size?: number
  label?: string
}) {
  const animated = useCountUp(score)
  const strokeWidth = size / 12
  const radius = size / 2 - strokeWidth
  const circumference = 2 * Math.PI * radius
  const progress = circumference * (1 - animated / 100)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-brand-btn-light"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className={cn('transition-[stroke-dashoffset] duration-300 ease-out', scoreStroke(score))}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', scoreColor(score))} style={{ fontSize: size / 3.4 }}>
            {animated}%
          </span>
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-brand-muted uppercase tracking-wide">{label}</span>}
    </div>
  )
}
