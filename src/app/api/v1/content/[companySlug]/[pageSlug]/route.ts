import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { rateLimit, clientIp, rateLimitHeaders } from '@/lib/rate-limit'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; pageSlug: string }> },
) {
  const limit = rateLimit(`content:${clientIp(_req)}`, 60, 60_000)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { ...CORS_HEADERS, ...rateLimitHeaders(limit) } },
    )
  }

  const { companySlug, pageSlug } = await params

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })

  if (!company) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  const page = await db.page.findFirst({
    where: {
      slug: pageSlug,
      isPublished: true,
      deletedAt: null,
      project: { companyId: company.id, isActive: true, deletedAt: null },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      schemaData: true,
      contentData: true,
      isAdvanced: true,
      updatedAt: true,
    },
  })

  if (!page) {
    return NextResponse.json(
      { error: 'Page not found or not published' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  const response = {
    slug: page.slug,
    name: page.name,
    updatedAt: page.updatedAt.toISOString(),
    ...(page.isAdvanced
      ? { schema: page.schemaData ?? {} }
      : { content: page.contentData ?? {} }),
  }

  return NextResponse.json(response, {
    status: 200,
    headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60, s-maxage=60' },
  })
}
