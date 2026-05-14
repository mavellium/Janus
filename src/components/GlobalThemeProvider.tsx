'use client'

import { useEffect } from 'react'
import { getUserPreferences } from '@/modules/users/actions/getUserPreferences'

interface GlobalThemeProviderProps {
  children: React.ReactNode
}

function updateFavicon(isDark: boolean) {
  let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    document.head.appendChild(link)
  }

  link.href = isDark ? '/favicon-white.png' : '/favicon.png'
}

export function GlobalThemeProvider({ children }: GlobalThemeProviderProps) {
  useEffect(() => {
    const applyThemeFromPreferences = async () => {
      try {
        const prefs = await getUserPreferences()
        const isDarkMode = prefs?.darkMode

        if (isDarkMode) {
          document.documentElement.classList.add('dark')
          localStorage.setItem('theme', 'dark')
          updateFavicon(true)
        } else {
          document.documentElement.classList.remove('dark')
          localStorage.setItem('theme', 'light')
          updateFavicon(false)
        }
      } catch (error) {
        console.error('Erro ao carregar preferências de tema:', error)
      }
    }

    applyThemeFromPreferences()

    const interval = setInterval(applyThemeFromPreferences, 30000)

    return () => clearInterval(interval)
  }, [])

  return <>{children}</>
}
