'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { Prisma, type GeoProbeMode, type GeoProvider } from '@/generated/prisma/client'
import { logAudit } from '@/lib/audit-logger'
import { calculateIagScore } from '../domain/calculateIagScore'
import { detectMention } from '../domain/detectMention'
import type { GeoTargetProfileContext, IagScoreInput } from '../domain/geoProbe'
import { getConfiguredProviders, getProbeAdapter, isProviderConfigured } from '../infra/providers'
import { requireAdmin } from './guard'

const ADMIN_GEO_PATH = '/dashboard-admin/geo'

const PROBE_MODES: GeoProbeMode[] = ['MODEL_MEMORY', 'LIVE_SEARCH']
const MAX_QUESTIONS_PER_RUN = 25
const RUN_COOLDOWN_MS = 60 * 60 * 1000

export interface RaioXTask {
  questionId: string
  questionText: string
  layer: 'DECISAO' | 'AVALIACAO' | 'PROBLEMA'
  provider: GeoProvider
  mode: GeoProbeMode
}

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: number }

const prepareSchema = z.object({
  profileId: z.string().uuid(),
  providers: z.array(z.enum(['OPENAI', 'GEMINI', 'PERPLEXITY', 'CLAUDE'])).min(1),
  modes: z.array(z.enum(['MODEL_MEMORY', 'LIVE_SEARCH'])).min(1),
})

/**
 * Valida os guardrails (cooldown, provedores configurados, perguntas ativas) e devolve a
 * lista de tarefas (pergunta × provedor × modo) para o client executar uma a uma via
 * `runSingleGeoProbe`, permitindo progresso em tempo real na UI.
 */
export async function prepareRaioXRun(input: {
  profileId: string
  providers?: GeoProvider[]
  modes?: GeoProbeMode[]
  force?: boolean
}): Promise<ActionResult<{ tasks: RaioXTask[] }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const requestedProviders = input.providers ?? getConfiguredProviders()
  if (requestedProviders.length === 0) {
    return {
      ok: false,
      error:
        'Nenhum provedor de IA configurado. Defina OPENAI_API_KEY, GEMINI_API_KEY ou PERPLEXITY_API_KEY.',
      code: 422,
    }
  }

  const parsed = prepareSchema.safeParse({
    profileId: input.profileId,
    providers: requestedProviders,
    modes: input.modes ?? PROBE_MODES,
  })
  if (!parsed.success) {
    return { ok: false, error: 'Parâmetros inválidos para o Raio-X.', code: 400 }
  }

  const { profileId, providers, modes } = parsed.data

  const unconfigured = providers.filter((provider) => !isProviderConfigured(provider))
  if (unconfigured.length > 0) {
    return {
      ok: false,
      error: `Provedor(es) sem credencial configurada: ${unconfigured.join(', ')}.`,
      code: 422,
    }
  }

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: profileId, archivedAt: null },
    select: { id: true },
  })
  if (!profile) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const recentRun = await db.geoScoreSnapshot.findFirst({
    where: { profileId, createdAt: { gte: new Date(Date.now() - RUN_COOLDOWN_MS) } },
    select: { id: true, createdAt: true },
  })
  if (recentRun && !input.force) {
    const availableAt = new Date(recentRun.createdAt.getTime() + RUN_COOLDOWN_MS)
    return {
      ok: false,
      error: `Já existe um Raio-X executado na última hora para esta empresa. Próxima execução liberada às ${availableAt.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}, ou force uma nova execução.`,
      code: 429,
    }
  }

  if (recentRun && input.force) {
    await logAudit({
      userId: guard.actor.userId,
      action: 'CREATE',
      entity: 'GeoScoreSnapshot',
      entityId: profileId,
      entityLabel: 'Raio-X forçado antes do fim do cooldown de 1h',
    })
  }

  const questions = await db.geoTargetQuestion.findMany({
    where: { profileId, status: 'ACTIVE' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: MAX_QUESTIONS_PER_RUN,
    select: { id: true, text: true, layer: true },
  })

  if (questions.length === 0) {
    return {
      ok: false,
      error: 'Cadastre ao menos uma pergunta-alvo ativa antes de rodar o Raio-X.',
      code: 422,
    }
  }

  const tasks: RaioXTask[] = []
  for (const question of questions) {
    for (const provider of providers) {
      if (!getProbeAdapter(provider)) continue
      for (const mode of modes) {
        tasks.push({
          questionId: question.id,
          questionText: question.text,
          layer: question.layer,
          provider,
          mode,
        })
      }
    }
  }

  if (tasks.length === 0) {
    return { ok: false, error: 'Nenhum provedor disponível para executar o Raio-X.', code: 422 }
  }

  return { ok: true, data: { tasks } }
}

const singleProbeSchema = z.object({
  profileId: z.string().uuid(),
  questionId: z.string().uuid(),
  provider: z.enum(['OPENAI', 'GEMINI', 'PERPLEXITY', 'CLAUDE']),
  mode: z.enum(['MODEL_MEMORY', 'LIVE_SEARCH']),
})

export interface SingleProbeResultData {
  probeRunId: string
  provider: GeoProvider
  mode: GeoProbeMode
  companyMentioned: boolean
  mentionedCompetitorName: string | null
  rawResponse: string
  citedUrls: string[]
  costUsdCents: number | null
  errorMessage: string | null
}

/**
 * Executa e persiste imediatamente uma única consulta (pergunta × provedor × modo). Sem
 * `snapshotId` até `finalizeRaioXRun` agregar todos os probes desta execução.
 */
export async function runSingleGeoProbe(input: {
  profileId: string
  questionId: string
  provider: GeoProvider
  mode: GeoProbeMode
}): Promise<ActionResult<SingleProbeResultData>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = singleProbeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Parâmetros inválidos.', code: 400 }
  }
  const { profileId, questionId, provider, mode } = parsed.data

  const adapter = getProbeAdapter(provider)
  if (!adapter || !isProviderConfigured(provider)) {
    return { ok: false, error: `Provedor ${provider} não configurado.`, code: 422 }
  }

  const [profile, question, competitors] = await Promise.all([
    db.geoTargetProfile.findFirst({ where: { id: profileId, archivedAt: null } }),
    db.geoTargetQuestion.findFirst({ where: { id: questionId, profileId } }),
    db.geoCompetitor.findMany({ where: { profileId }, select: { id: true, name: true, aliases: true } }),
  ])
  if (!profile) return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  if (!question) return { ok: false, error: 'Pergunta não encontrada', code: 404 }

  const profileContext: GeoTargetProfileContext = {
    name: profile.name,
    aliases: profile.aliases,
    description: profile.description,
    industry: profile.industry,
    location: profile.location,
    website: profile.website,
    targetAudience: profile.targetAudience,
    differentiators: profile.differentiators,
  }

  const probe = await adapter.probeQuestion({ question: question.text, mode, profile: profileContext })
  const errored = Boolean(probe.errorMessage)

  const detection = errored
    ? { companyMentioned: false, mentionedCompetitorId: null }
    : detectMention({
        responseText: probe.rawResponse,
        companyName: profile.name,
        companyAliases: profile.aliases,
        competitors,
      })

  const probeRun = await db.geoProbeRun.create({
    data: {
      profileId,
      targetQuestionId: questionId,
      provider,
      mode,
      rawResponse: probe.rawResponse,
      companyMentioned: detection.companyMentioned,
      mentionedCompetitorId: detection.mentionedCompetitorId,
      citedUrls: probe.citedUrls,
      costUsdCents: probe.costUsdCents,
      errorMessage: probe.errorMessage,
    },
  })

  const mentionedCompetitorName = detection.mentionedCompetitorId
    ? (competitors.find((c) => c.id === detection.mentionedCompetitorId)?.name ?? null)
    : null

  return {
    ok: true,
    data: {
      probeRunId: probeRun.id,
      provider,
      mode,
      companyMentioned: detection.companyMentioned,
      mentionedCompetitorName,
      rawResponse: probe.rawResponse,
      citedUrls: probe.citedUrls,
      costUsdCents: probe.costUsdCents,
      errorMessage: probe.errorMessage,
    },
  }
}

const finalizeSchema = z.object({
  profileId: z.string().uuid(),
  probeRunIds: z.array(z.string().uuid()).min(1),
  providers: z.array(z.enum(['OPENAI', 'GEMINI', 'PERPLEXITY', 'CLAUDE'])).min(1),
  modes: z.array(z.enum(['MODEL_MEMORY', 'LIVE_SEARCH'])).min(1),
})

export interface FinalizeRunResultData {
  snapshotId: string
  score: number
  probes: number
  errors: number
}

/**
 * Agrega os `GeoProbeRun` já persistidos por `runSingleGeoProbe` em um `GeoScoreSnapshot`,
 * calcula o IAG Score e vincula os probes ao snapshot.
 */
export async function finalizeRaioXRun(input: {
  profileId: string
  probeRunIds: string[]
  providers: GeoProvider[]
  modes: GeoProbeMode[]
}): Promise<ActionResult<FinalizeRunResultData>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = finalizeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Parâmetros inválidos.', code: 400 }
  }
  const { profileId, probeRunIds, providers, modes } = parsed.data

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: profileId, archivedAt: null },
    select: { id: true, name: true },
  })
  if (!profile) return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }

  const probeRuns = await db.geoProbeRun.findMany({
    where: { id: { in: probeRunIds }, profileId, snapshotId: null },
    include: { targetQuestion: { select: { id: true, layer: true } } },
  })
  if (probeRuns.length === 0) {
    return { ok: false, error: 'Nenhuma consulta válida para finalizar.', code: 422 }
  }

  const scoreInputs: IagScoreInput[] = probeRuns.map((run) => ({
    questionId: run.targetQuestionId,
    layer: run.targetQuestion.layer,
    companyMentioned: run.companyMentioned,
    mentionedCompetitorId: run.mentionedCompetitorId,
    errored: Boolean(run.errorMessage),
  }))

  const result = calculateIagScore(scoreInputs)
  const totalCostUsdCents = probeRuns.reduce((sum, run) => sum + (run.costUsdCents ?? 0), 0)

  const snapshot = await db.$transaction(async (tx) => {
    const created = await tx.geoScoreSnapshot.create({
      data: {
        profileId,
        userId: guard.actor.userId,
        score: result.score,
        breakdown: {
          totalProbes: result.totalProbes,
          countedProbes: result.countedProbes,
          erroredProbes: result.erroredProbes,
          mentionedProbes: result.mentionedProbes,
          byQuestion: result.byQuestion,
          providers,
          modes,
        } as unknown as Prisma.InputJsonValue,
        competitorComparison: result.competitorComparison as unknown as Prisma.InputJsonValue,
        totalCostUsdCents,
      },
    })

    await tx.geoProbeRun.updateMany({
      where: { id: { in: probeRuns.map((run) => run.id) } },
      data: { snapshotId: created.id },
    })

    return created
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'CREATE',
    entity: 'GeoScoreSnapshot',
    entityId: snapshot.id,
    entityLabel: `Raio-X ${profile.name} — IAG ${result.score}`,
    newData: {
      score: result.score,
      totalProbes: result.totalProbes,
      erroredProbes: result.erroredProbes,
      totalCostUsdCents,
    },
  })

  revalidatePath(ADMIN_GEO_PATH)

  return {
    ok: true,
    data: {
      snapshotId: snapshot.id,
      score: result.score,
      probes: result.totalProbes,
      errors: result.erroredProbes,
    },
  }
}
