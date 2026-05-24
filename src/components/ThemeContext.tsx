'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextValue {
  darkMode: boolean
  setDarkMode: (value: boolean) => void
  userImage: string | null
  setUserImage: (value: string | null) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  darkMode: false,
  setDarkMode: () => {},
  userImage: null,
  setUserImage: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
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

export function ThemeProvider({
  children,
  darkMode: initialDarkMode = false,
  userImage: initialUserImage = null,
}: {
  children: React.ReactNode
  darkMode?: boolean
  userImage?: string | null
}) {
  const [darkMode, setDarkModeState] = useState(initialDarkMode)
  const [userImage, setUserImage] = useState(initialUserImage)

  function setDarkMode(value: boolean) {
    setDarkModeState(value)
    if (value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    updateFavicon(value)
  }

  useEffect(() => {
    setDarkMode(initialDarkMode)
  }, [initialDarkMode])

  useEffect(() => {
    setUserImage(initialUserImage)
  }, [initialUserImage])

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, userImage, setUserImage }}>
      {children}
    </ThemeContext.Provider>
  )
}
