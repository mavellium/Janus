'use client'

import { useEffect } from 'react'
import { getUserPreferences } from '@/modules/users/actions/getUserPreferences'

interface GlobalThemeProviderProps {
  children: React.ReactNode
}

export function GlobalThemeProvider({ children }: GlobalThemeProviderProps) {
  useEffect(() => {
    // Função para buscar preferências e aplicar tema
    const applyThemeFromPreferences = async () => {
      try {
        const prefs = await getUserPreferences()
        const isDarkMode = prefs?.darkMode
        
        // Sincronizar com localStorage
        if (isDarkMode) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de tema:', error)
      }
    }

    // Aplicar tema imediatamente
    applyThemeFromPreferences()
    
    // Sincronizar preferências periodicamente (para múltiplos dispositivos)
    const interval = setInterval(applyThemeFromPreferences, 30000) // 30 segundos
    
    return () => clearInterval(interval)
  }, [])

  return <>{children}</>
}
