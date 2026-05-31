import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; projectId: string; postId: string }> },
) {
  const { companySlug, projectId, postId } = await params

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

  const lookupWhere = UUID_RE.test(postId) ? { id: postId } : { slug: postId }

  const post = await db.blogPost.findFirst({
    where: {
      ...lookupWhere,
      projectId,
      status: 'PUBLISHED',
      publishedAt: { not: null, lte: new Date() },
      project: { companyId: company.id, blogEnabled: true, isActive: true, deletedAt: null },
    },
    select: {
      id: true,
      slug: true,
      readingTime: true,
      title: true,
      subtitle: true,
      publishedAt: true,
      body: true,
      authorName: true,
      coverImageUrl: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      categories: { select: { category: true } },
      tags: { select: { tag: true } },
      project: { select: { id: true, name: true } },
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!post) {
    return NextResponse.json(
      { success: false, error: 'Post not found or not published' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  return NextResponse.json(
    { success: true, company: companySlug, projectId, post },
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    },
  )
}
