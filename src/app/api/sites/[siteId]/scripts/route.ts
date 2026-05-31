import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { rateLimit, clientIp, rateLimitHeaders } from '@/lib/rate-limit'

export const revalidate = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const limit = rateLimit(`scripts:${clientIp(_req)}`, 120, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: rateLimitHeaders(limit) },
    )
  }

  const { siteId } = await params

  try {
    const scripts = await db.siteScript.findMany({
      where: { projectId: siteId, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, code: true, position: true },
    })

    return NextResponse.json(
      { ok: true, data: scripts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      },
    )
  } catch {
    return NextResponse.json({ ok: false, error: 'Erro ao buscar scripts' }, { status: 500 })
  }
}
