import type { SeoCheckResult, SeoCheckSeverity } from './seoCheck'

export interface SiteUrlEntry {
  url: string
  name: string | null
}

export interface PageScanResult {
  url: string
  name: string | null
  ok: boolean
  error?: string
  seoScore: number
  geoScore: number
  seoChecks: SeoCheckResult[]
  geoChecks: SeoCheckResult[]
}

export interface SiteScanData {
  seoScore: number
  geoScore: number
  pagesScanned: number
  pages: PageScanResult[]
  generatedAt: string
}

export interface SiteCommonIssue {
  key: string
  label: string
  severity: SeoCheckSeverity
  scope: 'seo' | 'geo'
  failedCount: number
}

function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const url = base ? new URL(raw, base) : new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    url.hash = ''
    url.search = ''
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }
    return url.toString()
  } catch {
    return null
  }
}

export function mergeSiteUrls(
  base: string,
  dbPages: SiteUrlEntry[],
  sitemapUrls: string[],
  cap: number
): SiteUrlEntry[] {
  const normalizedBase = normalizeUrl(base)
  if (!normalizedBase) return []

  const baseHost = new URL(normalizedBase).host
  const merged = new Map<string, SiteUrlEntry>()

  merged.set(normalizedBase, { url: normalizedBase, name: 'Página inicial' })

  for (const entry of dbPages) {
    const normalized = normalizeUrl(entry.url, normalizedBase)
    if (!normalized) continue
    if (new URL(normalized).host !== baseHost) continue
    const existing = merged.get(normalized)
    if (existing) {
      if (!existing.name && entry.name) existing.name = entry.name
    } else {
      merged.set(normalized, { url: normalized, name: entry.name })
    }
  }

  for (const raw of sitemapUrls) {
    if (merged.size >= cap) break
    const normalized = normalizeUrl(raw, normalizedBase)
    if (!normalized) continue
    if (new URL(normalized).host !== baseHost) continue
    if (!merged.has(normalized)) merged.set(normalized, { url: normalized, name: null })
  }

  return Array.from(merged.values()).slice(0, cap)
}

export function aggregateSiteScan(pages: PageScanResult[]): { seoScore: number; geoScore: number } {
  const ok = pages.filter((page) => page.ok)
  if (ok.length === 0) return { seoScore: 0, geoScore: 0 }
  const seoScore = Math.round(ok.reduce((sum, page) => sum + page.seoScore, 0) / ok.length)
  const geoScore = Math.round(ok.reduce((sum, page) => sum + page.geoScore, 0) / ok.length)
  return { seoScore, geoScore }
}

export function computeCommonIssues(pages: PageScanResult[]): SiteCommonIssue[] {
  const ok = pages.filter((page) => page.ok)
  const byKey = new Map<string, SiteCommonIssue>()

  const tally = (checks: SeoCheckResult[], scope: 'seo' | 'geo') => {
    for (const check of checks) {
      if (check.passed || check.maxPoints === 0) continue
      const existing = byKey.get(check.key)
      if (existing) {
        existing.failedCount += 1
      } else {
        byKey.set(check.key, {
          key: check.key,
          label: check.label,
          severity: check.severity,
          scope,
          failedCount: 1,
        })
      }
    }
  }

  for (const page of ok) {
    tally(page.seoChecks, 'seo')
    tally(page.geoChecks, 'geo')
  }

  const severityOrder: Record<SeoCheckSeverity, number> = { critical: 0, important: 1, minor: 2 }
  return Array.from(byKey.values()).sort(
    (a, b) => b.failedCount - a.failedCount || severityOrder[a.severity] - severityOrder[b.severity]
  )
}
