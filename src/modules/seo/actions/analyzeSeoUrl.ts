'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { getImpersonatedUserId } from '@/lib/auth/permissions'
import { Prisma } from '@/generated/prisma/client'
import { SafeFetchError, type SafeFetchErrorCode } from '@/lib/security/safe-fetch'
import { fetchTargetPage } from '../infra/fetchTargetPage'
import { parsePage } from '../infra/parseHtml'
import { scoreSeo } from '../domain/seoScoring'
import { scoreGeoFoundation } from '../domain/geoFoundationScoring'
import type { SeoAnalysisResult } from '../domain/seoCheck'

const RATE_LIMIT_PER_DAY = 20

const inputSchema = z.object({
  url: z.url(),
  companySlug: z.string().min(1),
})

const FETCH_ERROR_MESSAGES: Record<SafeFetchErrorCode, string> = {
  INVALID_URL: 'URL inválida. Verifique o endereço digitado.',
  PRIVATE_ADDRESS_BLOCKED: 'Não foi possível acessar essa URL.',
  TIMEOUT: 'O site demorou demais para responder. Tente novamente em instantes.',
  TOO_LARGE: 'A página é grande demais para ser analisada.',
  TOO_MANY_REDIRECTS: 'A página possui redirecionamentos demais.',
  BLOCKED_BY_TARGET: 'Esse site bloqueou o acesso automatizado (proteção anti-bot). Não é possível analisá-lo no momento.',
  UNREACHABLE: 'Não conseguimos acessar esse site a partir do nosso servidor. Tente novamente em instantes.',
}

export async function analyzeSeoUrl(input: {
  url: string
  companySlug: string
}): Promise<
  | { ok: true; data: { analysisId: string; result: SeoAnalysisResult } }
  | { ok: false; error: string; code?: number }
> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'URL inválida. Verifique o endereço digitado.', code: 400 }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Não autorizado', code: 401 }
  }

  const { url, companySlug } = parsed.data

  if (session.user.role !== 'ADMIN' && session.user.companySlug !== companySlug) {
    return { ok: false, error: 'Acesso negado', code: 403 }
  }

  const impersonatedUserId = await getImpersonatedUserId()
  const effectiveUserId = impersonatedUserId ?? session.user.id

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
    select: { id: true },
  })
  if (!company) {
    return { ok: false, error: 'Empresa não encontrada', code: 404 }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const usedToday = await db.seoAnalysis.count({
    where: { companyId: company.id, createdAt: { gte: since } },
  })
  if (usedToday >= RATE_LIMIT_PER_DAY) {
    return {
      ok: false,
      error: `Limite de ${RATE_LIMIT_PER_DAY} análises por dia atingido. Tente novamente amanhã.`,
      code: 429,
    }
  }

  try {
    const fetched = await fetchTargetPage(url)
    const parsedPage = parsePage(fetched.html)
    const { score, checks } = scoreSeo({
      ...parsedPage,
      finalUrl: fetched.finalUrl,
      responseTimeMs: fetched.responseTimeMs,
      robotsTxtAccessible: fetched.robotsTxtAccessible,
      sitemapAccessible: fetched.sitemapAccessible,
    })
    const geoFoundation = scoreGeoFoundation({
      robotsTxtBody: fetched.robotsTxtBody,
      jsonLdTypes: parsedPage.jsonLdTypes,
    })

    const result: SeoAnalysisResult = {
      score,
      checks,
      geoFoundation,
      targetUrl: fetched.finalUrl,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: fetched.responseTimeMs,
      contentAccessible: fetched.contentAccessible,
    }

    const analysis = await db.seoAnalysis.create({
      data: {
        companyId: company.id,
        userId: effectiveUserId,
        targetUrl: fetched.finalUrl,
        score,
        checks: {
          seo: checks,
          geoFoundation,
          contentAccessible: fetched.contentAccessible,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    revalidatePath(`/${companySlug}/dashboard`)

    return { ok: true, data: { analysisId: analysis.id, result } }
  } catch (error) {
    if (error instanceof SafeFetchError) {
      return { ok: false, error: FETCH_ERROR_MESSAGES[error.code], code: 422 }
    }
    console.error('[analyzeSeoUrl]', error)
    return { ok: false, error: 'Erro inesperado ao analisar a URL. Tente novamente.', code: 500 }
  }
}
