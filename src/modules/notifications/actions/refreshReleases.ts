'use server'

import { updateTag } from 'next/cache'
import { auth } from '@/lib/auth'

export async function refreshReleases(): Promise<
  { ok: true; data: null } | { ok: false; error: string; code?: number }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autorizado', code: 401 }
  }

  updateTag('github-releases')
  return { ok: true, data: null }
}
