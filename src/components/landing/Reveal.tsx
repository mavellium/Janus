'use client'

import type { ReactNode } from 'react'
import { useInView } from './useInView'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>(0.12)

  return (
    <div
      ref={ref}
      data-lp-reveal={inView}
      className={className}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
