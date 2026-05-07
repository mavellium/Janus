import 'next-auth'
import type { DefaultSession } from 'next-auth'

export interface UserPreferences {
  sidebar_collapsed?: boolean
  theme?: 'light' | 'dark'
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      image?: string | null
    } & DefaultSession['user']
  }
  interface User {
    role?: string
    image?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    image?: string | null
  }
}
