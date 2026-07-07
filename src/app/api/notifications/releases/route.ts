import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getSystemReleases,
  RELEASES_PER_PAGE,
} from '@/modules/notifications/queries/getReleases'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const rawPage = Number(request.nextUrl.searchParams.get('page'))
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1

  const releases = await getSystemReleases(page)

  return Response.json({
    releases,
    hasMore: releases.length === RELEASES_PER_PAGE,
  })
}
