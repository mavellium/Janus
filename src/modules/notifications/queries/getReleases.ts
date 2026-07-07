import { sanitizeArticleHtml } from '@/lib/sanitize-html'
import { db } from '@/lib/prisma'
import type { UserPreferences } from '@/types/next-auth'
import type { SystemRelease } from '../domain/release'

const GITHUB_REPO = 'mavellium/Janus'
const RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`
const REVALIDATE_SECONDS = 3600

export const RELEASES_PER_PAGE = 20

interface GithubRelease {
  id: number
  tag_name: string
  name: string | null
  body_html?: string
  published_at: string | null
  html_url: string
  draft: boolean
  prerelease: boolean
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.html+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

export async function getSystemReleases(page = 1): Promise<SystemRelease[]> {
  try {
    const res = await fetch(`${RELEASES_URL}?per_page=${RELEASES_PER_PAGE}&page=${page}`, {
      headers: buildHeaders(),
      next: { revalidate: REVALIDATE_SECONDS, tags: ['github-releases'] },
    })
    if (!res.ok) return []

    const releases = (await res.json()) as GithubRelease[]

    return releases
      .filter((release) => !release.draft)
      .map((release) => ({
        id: release.id,
        tagName: release.tag_name,
        name: release.name?.trim() || null,
        bodyHtml: release.body_html ? sanitizeArticleHtml(release.body_html) : '',
        publishedAt: release.published_at,
        htmlUrl: release.html_url,
        prerelease: release.prerelease,
      }))
  } catch {
    return []
  }
}

export async function getCurrentVersion(): Promise<string | null> {
  const releases = await getSystemReleases()
  const stable = releases.find((release) => !release.prerelease)
  return stable?.tagName ?? releases[0]?.tagName ?? null
}

export async function countUnreadReleases(userId: string): Promise<number> {
  const releases = await getSystemReleases()
  const published = releases.filter((release) => release.publishedAt)
  if (published.length === 0) return 0

  const row = await db.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  })

  const prefs = (row?.preferences ?? {}) as UserPreferences
  const lastSeenAt = prefs.notifications_last_seen_at
  if (!lastSeenAt) return published.length

  const seenAt = new Date(lastSeenAt)
  return published.filter((release) => new Date(release.publishedAt!) > seenAt).length
}
