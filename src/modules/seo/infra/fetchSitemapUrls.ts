import * as cheerio from 'cheerio'
import { safeFetch } from '@/lib/security/safe-fetch'

const SITEMAP_FETCH_OPTIONS = { timeoutMs: 6000, maxBytes: 2 * 1024 * 1024 }
const MAX_CHILD_SITEMAPS = 5
const MAX_URLS = 200

function extractLocs(xml: string): string[] {
  const $ = cheerio.load(xml, { xmlMode: true })
  const locs: string[] = []
  $('loc').each((_, element) => {
    const value = $(element).text().trim()
    if (value) locs.push(value)
  })
  return locs
}

async function fetchXml(url: string): Promise<string | null> {
  try {
    const result = await safeFetch(url, SITEMAP_FETCH_OPTIONS)
    if (result.status !== 200) return null
    return result.body
  } catch {
    return null
  }
}

export async function fetchSitemapUrls(origin: string): Promise<string[]> {
  const root = await fetchXml(`${origin}/sitemap.xml`)
  if (!root) return []

  const isIndex = /<sitemapindex[\s>]/i.test(root)
  if (!isIndex) {
    return extractLocs(root).slice(0, MAX_URLS)
  }

  const childSitemaps = extractLocs(root).slice(0, MAX_CHILD_SITEMAPS)
  const urls: string[] = []
  for (const child of childSitemaps) {
    if (urls.length >= MAX_URLS) break
    const body = await fetchXml(child)
    if (body) urls.push(...extractLocs(body))
  }
  return urls.slice(0, MAX_URLS)
}
