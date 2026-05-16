import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'

export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const role = (auth?.user as { role?: string })?.role
      const isDeveloper = role === 'DEVELOPER'
      const isAdmin = role === 'ADMIN'
      const slug = (auth?.user as { companySlug?: string })?.companySlug
      const userId = (auth?.user as { id?: string })?.id

      if (nextUrl.pathname === '/first-access') {
        return isLoggedIn
      }

      if (nextUrl.pathname === '/') {
        if (!isLoggedIn) return true
        if (isDeveloper) return NextResponse.redirect(new URL(`/dev/${userId}/dashboard`, nextUrl))
        if (isAdmin) return NextResponse.redirect(new URL('/dashboard-admin', nextUrl))
        return NextResponse.redirect(new URL(`/${slug}/dashboard`, nextUrl))
      }

      if (nextUrl.pathname.startsWith('/dashboard-admin')) {
        if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl))
        if (!isAdmin) return NextResponse.redirect(new URL('/login', nextUrl))
        return true
      }

      const devMatch = nextUrl.pathname.match(/^\/dev\/([^/]+)\/dashboard/)
      if (devMatch) {
        if (!isLoggedIn) return NextResponse.redirect(new URL('/login', nextUrl))
        if (!isDeveloper && !isAdmin) return NextResponse.redirect(new URL(`/${slug}/dashboard`, nextUrl))
        if (!isAdmin && devMatch[1] !== userId) {
          return NextResponse.redirect(new URL(`/dev/${userId}/dashboard`, nextUrl))
        }
        return true
      }

      const isProtectedRoute = /^\/[^/]+\/dashboard/.test(nextUrl.pathname)
      if (isProtectedRoute) {
        if (!isLoggedIn) {
          const pathCompanySlug = nextUrl.pathname.split('/')[1]
          return NextResponse.redirect(new URL(`/${pathCompanySlug}/welcome`, nextUrl))
        }
        if (isDeveloper || isAdmin) return true
        const pathCompanySlug = nextUrl.pathname.split('/')[1]
        if (slug && pathCompanySlug !== slug) {
          return NextResponse.redirect(new URL(`/${slug}/dashboard`, nextUrl))
        }
        return true
      }

      if (nextUrl.pathname.startsWith('/login') && isLoggedIn) {
        if (isDeveloper) return NextResponse.redirect(new URL(`/dev/${userId}/dashboard`, nextUrl))
        if (isAdmin) return NextResponse.redirect(new URL('/dashboard-admin', nextUrl))
        return NextResponse.redirect(new URL(`/${slug}/dashboard`, nextUrl))
      }

      return true
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
        token.permissions = (user as { permissions?: string[] }).permissions ?? []
        token.image = (user as { image?: string | null }).image ?? null
        token.companySlug = (user as { companySlug?: string | null }).companySlug ?? undefined
      }
      if (trigger === 'update' && session?.permissions) {
        token.permissions = session.permissions as string[]
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.permissions = (token.permissions as string[]) ?? []
        session.user.image = token.image as string | null
        session.user.companySlug = token.companySlug as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
