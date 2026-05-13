import { NextResponse } from 'next/server'
import { db } from '@/lib/prisma'

export async function GET() {
  const guests = await db.guestEntry.findMany({
    include: {
      company: { select: { id: true, name: true, slug: true } },
      posts: { select: { id: true, title: true, message: true, imageUrl: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ ok: true, data: guests })
}
