import 'next-auth'
import type { DefaultSession } from 'next-auth'

export interface UserPreferences {
  sidebar_collapsed?: boolean
  theme?: 'light' | 'dark'
  darkMode?: boolean
  notifications_last_seen_at?: string
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      permissions: string[]
      image?: string | null
      companySlug: string
    } & DefaultSession['user']
  }
  interface User {
    role?: string
    permissions?: string[]
    image?: string | null
    companySlug?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    permissions?: string[]
    image?: string | null
    companySlug?: string
  }
}
