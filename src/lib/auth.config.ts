import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname
      const isLoggedIn = !!auth?.user

      const publicRoutes = ['/login', '/register']
      const isPublicRoute = publicRoutes.includes(pathname)

      if (!isLoggedIn && !isPublicRoute) {
        return false
      }

      if (isLoggedIn && isPublicRoute) {
        return true
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role?: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
} satisfies NextAuthConfig
