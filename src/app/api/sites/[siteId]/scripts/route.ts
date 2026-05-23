import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export const revalidate = 60

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> },
) {
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
