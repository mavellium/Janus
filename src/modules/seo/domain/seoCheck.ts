export type SeoCheckSeverity = 'critical' | 'important' | 'minor'

export interface SeoCheckResult {
  key: string
  label: string
  passed: boolean
  severity: SeoCheckSeverity
  points: number
  maxPoints: number
  message: string
  recommendation?: string
}

export interface ParsedPage {
  title: string | null
  metaDescription: string | null
  h1Count: number
  h2Count: number
  canonical: string | null
  hasViewport: boolean
  hasOgTitle: boolean
  hasOgDescription: boolean
  hasOgImage: boolean
  jsonLdCount: number
  jsonLdTypes: string[]
  wordCount: number
  imageCount: number
  imagesWithAlt: number
}

export interface PageSignals extends ParsedPage {
  finalUrl: string
  responseTimeMs: number
  robotsTxtAccessible: boolean
  sitemapAccessible: boolean
}

export interface SeoScoreResult {
  score: number
  checks: SeoCheckResult[]
}

export interface GeoFoundationSignals {
  robotsTxtBody: string
  jsonLdTypes: string[]
}

export type GeoFoundationResult = SeoScoreResult

export interface SeoAnalysisResult extends SeoScoreResult {
  targetUrl: string
  fetchedAt: string
  responseTimeMs: number
  geoFoundation: GeoFoundationResult
  contentAccessible: boolean
}

export const SEVERITY_ORDER: Record<SeoCheckSeverity, number> = {
  critical: 0,
  important: 1,
  minor: 2,
}

export const SEVERITY_LABELS: Record<SeoCheckSeverity, string> = {
  critical: 'Crítico',
  important: 'Importante',
  minor: 'Menor',
}
