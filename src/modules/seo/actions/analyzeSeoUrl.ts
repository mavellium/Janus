'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma/client'
import { SafeFetchError, type SafeFetchErrorCode } from '@/lib/security/safe-fetch'
import { fetchTargetPage } from '../infra/fetchTargetPage'
import { parsePage } from '../infra/parseHtml'
import { scoreSeo } from '../domain/seoScoring'
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
  UNREACHABLE: 'Não foi possível acessar essa URL. Verifique se o site está no ar.',
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

    const result: SeoAnalysisResult = {
      score,
      checks,
      targetUrl: fetched.finalUrl,
      fetchedAt: new Date().toISOString(),
      responseTimeMs: fetched.responseTimeMs,
    }

    const analysis = await db.seoAnalysis.create({
      data: {
        companyId: company.id,
        userId: session.user.id,
        targetUrl: fetched.finalUrl,
        score,
        checks: checks as unknown as Prisma.InputJsonValue,
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
