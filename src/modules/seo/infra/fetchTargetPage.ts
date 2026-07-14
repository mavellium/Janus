import { safeFetch, SafeFetchError, type SafeFetchResult } from '@/lib/security/safe-fetch'

export interface TargetPageFetch {
  html: string
  finalUrl: string
  responseTimeMs: number
  robotsTxtAccessible: boolean
  robotsTxtBody: string
  sitemapAccessible: boolean
  contentAccessible: boolean
}

const AUX_FETCH_OPTIONS = { timeoutMs: 5000, maxBytes: 256 * 1024 }

// Muitos WAFs/proteções anti-bot recusam User-Agents obviamente automatizados,
// mas liberam navegadores comuns. Sendo o Janus uma ferramenta de análise do
// próprio dono do site, uma segunda tentativa com UA de navegador é o caminho
// legítimo para obter o HTML real antes de degradar a pontuação.
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

async function fetchPrimaryPage(rawUrl: string): Promise<SafeFetchResult | null> {
  try {
    return await safeFetch(rawUrl)
  } catch (error) {
    if (!(error instanceof SafeFetchError) || error.code !== 'BLOCKED_BY_TARGET') {
      throw error
    }
    try {
      return await safeFetch(rawUrl, { userAgent: BROWSER_USER_AGENT })
    } catch (retryError) {
      if (retryError instanceof SafeFetchError && retryError.code === 'BLOCKED_BY_TARGET') {
        return null
      }
      throw retryError
    }
  }
}

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
  const startedAt = Date.now()
  const page = await fetchPrimaryPage(rawUrl)

  if (page && page.status >= 400) {
    throw new SafeFetchError('UNREACHABLE', `A página respondeu com HTTP ${page.status}`)
  }

  const finalUrl = page?.finalUrl ?? new URL(rawUrl).toString()
  const origin = new URL(finalUrl).origin
  const robots = await probeRobots(origin)
  const sitemapAccessible = await probeSitemap(origin, robots.body)

  return {
    html: page?.body ?? '',
    finalUrl,
    responseTimeMs: page?.responseTimeMs ?? Date.now() - startedAt,
    robotsTxtAccessible: robots.accessible,
    robotsTxtBody: robots.body,
    sitemapAccessible,
    contentAccessible: page !== null,
  }
}
