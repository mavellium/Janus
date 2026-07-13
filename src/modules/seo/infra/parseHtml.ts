import * as cheerio from 'cheerio'
import type { ParsedPage } from '../domain/seoCheck'

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
    wordCount,
    imageCount,
    imagesWithAlt,
  }
}
