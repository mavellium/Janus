'use client'

import { useEffect } from 'react'

interface ThemeScriptProps {
  darkMode?: boolean
}

export function ThemeScript({ darkMode }: ThemeScriptProps) {
  useEffect(() => {
    // Aplicar tema imediatamente para evitar piscada
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return null
}
