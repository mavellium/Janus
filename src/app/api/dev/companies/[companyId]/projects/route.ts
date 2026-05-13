import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'DEVELOPER') {
    return NextResponse.json({ projects: [] })
  }

  const { companyId } = await params
  const projects = await db.project.findMany({
    where: { companyId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, type: true, blogEnabled: true },
  })

  return NextResponse.json({ projects })
}
