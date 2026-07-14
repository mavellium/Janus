'use client'

import { cn } from '@/lib/utils'

const COLORS = ['bg-brand-primary', 'bg-brand-cta', 'bg-emerald-500', 'bg-amber-500']

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  delay: (i * 113) % 600,
  duration: 1800 + ((i * 211) % 900),
  size: 6 + ((i * 53) % 6),
  color: COLORS[i % COLORS.length],
  round: i % 3 === 0,
}))

export function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PIECES.map((piece, i) => (
        <span
          key={i}
          className={cn('onb-confetti absolute top-0', piece.color, piece.round ? 'rounded-full' : 'rounded-sm')}
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
          }}
        />
      ))}
    </div>
  )
}
