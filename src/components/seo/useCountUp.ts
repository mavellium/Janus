'use client'

import { useEffect, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let raf: number
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1)
      setValue(Math.round(target * easeOutCubic(progress)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
