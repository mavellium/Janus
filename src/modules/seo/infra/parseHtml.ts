import * as cheerio from 'cheerio'
import type { ParsedPage } from '../domain/seoCheck'

function collectJsonLdTypes(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    node.forEach((entry) => collectJsonLdTypes(entry, out))
    return
  }
  if (!node || typeof node !== 'object') return

  const obj = node as Record<string, unknown>
  const type = obj['@type']
  if (typeof type === 'string') out.push(type)
  else if (Array.isArray(type)) type.forEach((t) => typeof t === 'string' && out.push(t))

  if (Array.isArray(obj['@graph'])) collectJsonLdTypes(obj['@graph'], out)
}

function extractJsonLdTypes($: cheerio.CheerioAPI): string[] {
  const types: string[] = []
  $('script[type="application/ld+json"]').each((_, element) => {
    const raw = $(element).contents().text().trim()
    if (!raw) return
    try {
      collectJsonLdTypes(JSON.parse(raw), types)
    } catch {
      // JSON-LD malformado — ignora este bloco, não interrompe a análise
    }
  })
  return types
}

export function parsePage(html: string): ParsedPage {
  const $ = cheerio.load(html)

  const title = $('head title').first().text().trim() || null
  const metaDescription = ($('meta[name="description"]').attr('content') ?? '').trim() || null
  const h1Count = $('h1').length
  const h2Count = $('h2').length
  const canonical = ($('link[rel="canonical"]').attr('href') ?? '').trim() || null
  const hasViewport = $('meta[name="viewport"]').length > 0

  const ogContent = (property: string) =>
    ($(`meta[property="og:${property}"]`).attr('content') ?? '').trim().length > 0

  const hasOgTitle = ogContent('title')
  const hasOgDescription = ogContent('description')
  const hasOgImage = ogContent('image')

  const jsonLdCount = $('script[type="application/ld+json"]').length
  const jsonLdTypes = extractJsonLdTypes($)

  const images = $('img')
  const imageCount = images.length
  let imagesWithAlt = 0
  images.each((_, element) => {
    const alt = $(element).attr('alt')
    if (alt && alt.trim().length > 0) imagesWithAlt++
  })

  $('script, style, noscript, template').remove()
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()
  const wordCount = bodyText ? bodyText.split(' ').length : 0

  return {
    title,
    metaDescription,
    h1Count,
    h2Count,
    canonical,
    hasViewport,
    hasOgTitle,
    hasOgDescription,
    hasOgImage,
    jsonLdCount,
    jsonLdTypes,
    wordCount,
    imageCount,
    imagesWithAlt,
  }
}
