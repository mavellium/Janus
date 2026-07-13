import { safeFetch, SafeFetchError } from '@/lib/security/safe-fetch'

export interface TargetPageFetch {
  html: string
  finalUrl: string
  responseTimeMs: number
  robotsTxtAccessible: boolean
  sitemapAccessible: boolean
}

const AUX_FETCH_OPTIONS = { timeoutMs: 5000, maxBytes: 256 * 1024 }

async function probeRobots(origin: string): Promise<{ accessible: boolean; body: string }> {
  try {
    const result = await safeFetch(`${origin}/robots.txt`, AUX_FETCH_OPTIONS)
    return { accessible: result.status === 200, body: result.status === 200 ? result.body : '' }
  } catch {
    return { accessible: false, body: '' }
  }
}

async function probeSitemap(origin: string, robotsBody: string): Promise<boolean> {
  if (/^\s*sitemap\s*:/im.test(robotsBody)) return true
  try {
    const result = await safeFetch(`${origin}/sitemap.xml`, AUX_FETCH_OPTIONS)
    return result.status === 200
  } catch {
    return false
  }
}

export async function fetchTargetPage(rawUrl: string): Promise<TargetPageFetch> {
  const page = await safeFetch(rawUrl)

  if (page.status >= 400) {
    throw new SafeFetchError('UNREACHABLE', `A página respondeu com HTTP ${page.status}`)
  }

  const origin = new URL(page.finalUrl).origin
  const robots = await probeRobots(origin)
  const sitemapAccessible = await probeSitemap(origin, robots.body)

  return {
    html: page.body,
    finalUrl: page.finalUrl,
    responseTimeMs: page.responseTimeMs,
    robotsTxtAccessible: robots.accessible,
    sitemapAccessible,
  }
}
