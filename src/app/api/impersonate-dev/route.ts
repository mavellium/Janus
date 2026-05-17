import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { VIEW_MODE_COOKIE, VIEW_MODE_DEV, IMPERSONATED_DEV_ID_COOKIE, IMPERSONATED_USER_ID_COOKIE } from '@/lib/auth/permissions'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const role = session?.user?.role

    if (role !== 'ADMIN') {
      return NextResponse.json({ ok: false, error: 'Acesso não autorizado.' }, { status: 403 })
    }

    const { devId, companySlug } = await request.json()

    if (!devId || !companySlug) {
      return NextResponse.json({ ok: false, error: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const cookieStore = await cookies()

    cookieStore.set(VIEW_MODE_COOKIE, VIEW_MODE_DEV, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    cookieStore.set(IMPERSONATED_DEV_ID_COOKIE, devId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    cookieStore.delete(IMPERSONATED_USER_ID_COOKIE)

    return NextResponse.json({
      ok: true,
      redirectUrl: `/${companySlug}/dashboard`,
    })
  } catch (error) {
    console.error('[impersonate-dev API] Error:', error)
    return NextResponse.json({ ok: false, error: 'Erro ao configurar impersonação.' }, { status: 500 })
  }
}
