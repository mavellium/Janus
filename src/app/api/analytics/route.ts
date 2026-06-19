import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFullAnalyticsReport } from '@/lib/analytics/ga4-client'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const propertyId = searchParams.get('propertyId')?.trim()

  if (!propertyId) {
    return NextResponse.json(
      { ok: false, error: 'propertyId é obrigatório' },
      { status: 400 },
    )
  }

  try {
    const data = await getFullAnalyticsReport(propertyId)
    return NextResponse.json({ ok: true, data })
  } catch (error) {
    console.error('[api/analytics]', error)
    return NextResponse.json(
      { ok: false, error: 'Erro ao consultar o Google Analytics' },
      { status: 502 },
    )
  }
}
