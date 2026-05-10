'use client'

import { useEffect } from 'react'

interface ThemeProviderProps {
  children: React.ReactNode
  darkMode?: boolean
}

export function ThemeProvider({ children, darkMode }: ThemeProviderProps) {
  useEffect(() => {
    // Aplicar tema baseado nas preferências do usuário
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return <>{children}</>
}
