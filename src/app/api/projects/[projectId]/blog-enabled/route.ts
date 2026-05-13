import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ blogEnabled: false })

  const { projectId } = await params
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { blogEnabled: true },
  })

  return NextResponse.json({ blogEnabled: project?.blogEnabled ?? false })
}
