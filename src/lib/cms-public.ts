import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, clientIp, rateLimitHeaders } from '@/lib/rate-limit'

export const CMS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const

export function cmsOptions() {
  return new NextResponse(null, { status: 204, headers: CMS_CORS })
}

export function cmsRateLimit(req: NextRequest): NextResponse | null {
  const limit = rateLimit(`content:${clientIp(req)}`, 60, 60_000)
  if (limit.allowed) return null
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { ...CMS_CORS, ...rateLimitHeaders(limit) } },
  )
}

export function cmsJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      ...CMS_CORS,
      'Cache-Control': 'public, max-age=60, s-maxage=60',
    },
  })
}

export function cmsError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CMS_CORS })
}
