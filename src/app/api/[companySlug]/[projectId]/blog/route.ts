import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

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
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; projectId: string }> },
) {
  const { companySlug, projectId } = await params
  const { searchParams } = req.nextUrl

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
  const search = searchParams.get('search')?.trim() ?? ''
  const categoryId = searchParams.get('categoryId')?.trim() ?? ''
  const skip = (page - 1) * limit

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })

  if (!company) {
    return NextResponse.json(
      { success: false, error: 'Company not found' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  const where = {
    projectId,
    status: 'PUBLISHED' as const,
    publishedAt: { not: null, lte: new Date() },
    project: { companyId: company.id, blogEnabled: true, isActive: true, deletedAt: null },
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { subtitle: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(categoryId && {
      categories: { some: { categoryId } },
    }),
  }

  const [total, posts] = await Promise.all([
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        status: true,
        publishedAt: true,
        coverImageUrl: true,
        authorName: true,
        readingTime: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        categories: { select: { category: true } },
        tags: { select: { tag: true } },
        project: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  return NextResponse.json(
    {
      success: true,
      company: companySlug,
      projectId,
      posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    },
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    },
  )
}
