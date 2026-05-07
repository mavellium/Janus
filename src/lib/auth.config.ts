import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthRoute = nextUrl.pathname.startsWith('/login')
      const isProtectedRoute = nextUrl.pathname === '/' || nextUrl.pathname.startsWith('/dashboard')

      if (isProtectedRoute) {
        return isLoggedIn
      }

      if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.image = (user as { image?: string | null }).image ?? null
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.image = token.image as string | null
      }
      return session
    },
  },
} satisfies NextAuthConfig
