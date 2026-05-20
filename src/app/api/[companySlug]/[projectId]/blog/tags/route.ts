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
  _req: NextRequest,
  { params }: { params: Promise<{ companySlug: string; projectId: string }> },
) {
  const { companySlug, projectId } = await params

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

  const project = await db.project.findFirst({
    where: { id: projectId, companyId: company.id, blogEnabled: true, isActive: true, deletedAt: null },
    select: { id: true },
  })

  if (!project) {
    return NextResponse.json(
      { success: false, error: 'Project not found or blog not enabled' },
      { status: 404, headers: CORS_HEADERS },
    )
  }

  const tags = await db.blogTag.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
    include: {
      parent: true,
      children: { orderBy: { name: 'asc' } },
    },
  })

  return NextResponse.json(
    { success: true, company: companySlug, projectId, tags },
    {
      status: 200,
      headers: { ...CORS_HEADERS, 'Cache-Control': 'public, max-age=60, s-maxage=60' },
    },
  )
}
