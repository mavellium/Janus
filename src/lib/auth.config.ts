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
      const isProtectedRoute = nextUrl.pathname === '/' || /^\/[^/]+\/dashboard/.test(nextUrl.pathname)

      if (isProtectedRoute) {
        if (!isLoggedIn) return false
        const userCompanySlug = (auth.user as { companySlug?: string }).companySlug
        const pathCompanySlug = nextUrl.pathname.split('/')[1]
        if (userCompanySlug && pathCompanySlug !== userCompanySlug) {
          return NextResponse.redirect(new URL(`/${userCompanySlug}/dashboard`, nextUrl))
        }
        return true
      }

      if (isAuthRoute && isLoggedIn) {
        const companySlug = (auth.user as { companySlug?: string }).companySlug || 'default'
        return NextResponse.redirect(new URL(`/${companySlug}/dashboard`, nextUrl))
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.image = (user as { image?: string | null }).image ?? null
        token.companySlug = (user as { companySlug?: string }).companySlug
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.image = token.image as string | null
        session.user.companySlug = token.companySlug as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
