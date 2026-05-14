'use client'

import { useEffect } from 'react'

interface ThemeScriptProps {
  darkMode?: boolean
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

export function ThemeScript({ darkMode }: ThemeScriptProps) {
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      updateFavicon(true)
    } else {
      document.documentElement.classList.remove('dark')
      updateFavicon(false)
    }
  }, [darkMode])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    updateFavicon(isDark)

    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      updateFavicon(isDark)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  return null
}
