import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const hasAuth = !!req.auth
  const pathname = req.nextUrl.pathname

  if (!hasAuth && (pathname === '/' || pathname.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (hasAuth && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)'],
}
