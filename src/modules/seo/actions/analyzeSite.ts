'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { SafeFetchError, type SafeFetchErrorCode, safeFetch } from '@/lib/security/safe-fetch'
import { parsePage } from '../infra/parseHtml'
import { fetchSitemapUrls } from '../infra/fetchSitemapUrls'
import { scoreSeo } from '../domain/seoScoring'
import { scoreGeoFoundation } from '../domain/geoFoundationScoring'
import {
  aggregateSiteScan,
  mergeSiteUrls,
  type PageScanResult,
  type SiteScanData,
  type SiteUrlEntry,
} from '../domain/siteScan'

const MAX_PAGES = 20
const CONCURRENCY = 5
const RATE_LIMIT_SITE_SCANS_PER_DAY = 10
const ROBOTS_FETCH_OPTIONS = { timeoutMs: 5000, maxBytes: 256 * 1024 }

const inputSchema = z.object({
  projectId: z.string().min(1),
  companySlug: z.string().min(1),
})

const FETCH_ERROR_MESSAGES: Record<SafeFetchErrorCode, string> = {
  INVALID_URL: 'URL inválida.',
  PRIVATE_ADDRESS_BLOCKED: 'Não foi possível acessar essa URL.',
  TIMEOUT: 'A página demorou demais para responder.',
  TOO_LARGE: 'A página é grande demais para ser analisada.',
  TOO_MANY_REDIRECTS: 'A página possui redirecionamentos demais.',
  BLOCKED_BY_TARGET: 'A página bloqueou o acesso automatizado.',
  UNREACHABLE: 'Não conseguimos acessar essa página.',
}

async function probeRobots(origin: string): Promise<{ accessible: boolean; body: string }> {
  try {
    const result = await safeFetch(`${origin}/robots.txt`, ROBOTS_FETCH_OPTIONS)
    return { accessible: result.status === 200, body: result.status === 200 ? result.body : '' }
  } catch {
    return { accessible: false, body: '' }
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function run(): Promise<void> {
    for (;;) {
      const index = cursor++
      if (index >= items.length) return
      results[index] = await worker(items[index])
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run())
  await Promise.all(runners)
  return results
}

export async function analyzeSite(input: {
  projectId: string
  companySlug: string
}): Promise<
  | { ok: true; data: { scanId: string; data: SiteScanData; targetUrl: string } }
  | { ok: false; error: string; code?: number }
> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Dados inválidos.', code: 400 }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autorizado', code: 401 }
  }

  const { projectId, companySlug } = parsed.data

  if (session.user.role !== 'ADMIN' && session.user.companySlug !== companySlug) {
    return { ok: false, error: 'Acesso negado', code: 403 }
  }

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) {
    return { ok: false, error: 'Empresa não encontrada', code: 404 }
  }

  const project = await db.project.findFirst({
    where: { id: projectId, companyId: company.id, deletedAt: null },
    select: { id: true, previewUrl: true },
  })
  if (!project) {
    return { ok: false, error: 'Site não encontrado', code: 404 }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const usedToday = await db.seoAnalysis.count({
    where: { companyId: company.id, projectId, createdAt: { gte: since } },
  })
  if (usedToday >= RATE_LIMIT_SITE_SCANS_PER_DAY) {
    return {
      ok: false,
      error: `Limite de ${RATE_LIMIT_SITE_SCANS_PER_DAY} análises deste site por dia atingido. Tente novamente amanhã.`,
      code: 429,
    }
  }

  const pages = await db.page.findMany({
    where: { projectId, deletedAt: null, isPublished: true },
    select: { name: true, slug: true, previewUrl: true },
  })

  const baseUrl = project.previewUrl ?? pages.find((page) => page.previewUrl)?.previewUrl ?? null
  if (!baseUrl) {
    return {
      ok: false,
      error: 'Configure a URL pública do site (nas configurações do site) antes de analisá-lo.',
      code: 422,
    }
  }

  let origin: string
  try {
    origin = new URL(baseUrl).origin
  } catch {
    return { ok: false, error: 'A URL pública do site é inválida.', code: 422 }
  }

  const dbEntries: SiteUrlEntry[] = pages.map((page) => ({
    name: page.name,
    url: page.previewUrl ?? `${origin}/${page.slug.replace(/^\/+/, '')}`,
  }))

  const sitemapUrls = await fetchSitemapUrls(origin)
  const targets = mergeSiteUrls(baseUrl, dbEntries, sitemapUrls, MAX_PAGES)

  if (targets.length === 0) {
    return { ok: false, error: 'Não encontramos páginas para analisar neste site.', code: 422 }
  }

  const robots = await probeRobots(origin)
  const sitemapAccessible = sitemapUrls.length > 0 || /^\s*sitemap\s*:/im.test(robots.body)

  const results = await mapWithConcurrency<SiteUrlEntry, PageScanResult>(
    targets,
    CONCURRENCY,
    async (target) => {
      try {
        const fetched = await safeFetch(target.url)
        if (fetched.status >= 400) {
          throw new SafeFetchError('UNREACHABLE', `HTTP ${fetched.status}`)
        }
        const parsedPage = parsePage(fetched.body)
        const seo = scoreSeo({
          ...parsedPage,
          finalUrl: fetched.finalUrl,
          responseTimeMs: fetched.responseTimeMs,
          robotsTxtAccessible: robots.accessible,
          sitemapAccessible,
        })
        const geo = scoreGeoFoundation({
          robotsTxtBody: robots.body,
          jsonLdTypes: parsedPage.jsonLdTypes,
        })
        return {
          url: fetched.finalUrl,
          name: target.name,
          ok: true,
          seoScore: seo.score,
          geoScore: geo.score,
          seoChecks: seo.checks,
          geoChecks: geo.checks,
        }
      } catch (error) {
        const message =
          error instanceof SafeFetchError
            ? FETCH_ERROR_MESSAGES[error.code]
            : 'Erro ao analisar esta página.'
        return {
          url: target.url,
          name: target.name,
          ok: false,
          error: message,
          seoScore: 0,
          geoScore: 0,
          seoChecks: [],
          geoChecks: [],
        }
      }
    }
  )

  const { seoScore, geoScore } = aggregateSiteScan(results)
  const scannedOk = results.filter((page) => page.ok).length

  if (scannedOk === 0) {
    return {
      ok: false,
      error: 'Nenhuma página do site pôde ser acessada. Verifique se a URL pública está correta e online.',
      code: 422,
    }
  }

  const siteData: SiteScanData = {
    seoScore,
    geoScore,
    pagesScanned: scannedOk,
    pages: results,
    generatedAt: new Date().toISOString(),
  }

  const scan = await db.seoAnalysis.create({
    data: {
      companyId: company.id,
      userId: session.user.id,
      projectId,
      targetUrl: baseUrl,
      score: seoScore,
      checks: { site: siteData } as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  })

  revalidatePath(`/${companySlug}/dashboard/sites/${projectId}/seo`)
  revalidatePath(`/${companySlug}/dashboard/landing-pages/${projectId}/seo`)

  return { ok: true, data: { scanId: scan.id, data: siteData, targetUrl: baseUrl } }
}
