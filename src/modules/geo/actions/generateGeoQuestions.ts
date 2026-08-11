'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { logAudit, omitSensitive } from '@/lib/audit-logger'
import type { GeoQuestionLayer } from '@/generated/prisma/client'
import { buildQuestionPlan } from '../domain/buildQuestionPlan'
import {
  generateStructuredContent,
  GeminiSchemaType,
  StructuredGenerationError,
} from '../infra/ai/generateStructuredContent'
import { requireAdmin } from './guard'

const ADMIN_GEO_PATH = '/dashboard-admin/geo'

const MIN_QUESTIONS = 3
const MAX_QUESTIONS = 15

type ActionResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string; code?: number }

export type QuestionLayer = GeoQuestionLayer

export interface GeneratedQuestion {
  text: string
  layer: QuestionLayer
}

const generatedQuestionSchema = z.object({
  text: z.string().min(10).max(500),
  layer: z.enum(['DECISAO', 'AVALIACAO', 'PROBLEMA']),
})

const QUESTION_JSON_SCHEMA = {
  type: GeminiSchemaType.OBJECT,
  properties: {
    text: {
      type: GeminiSchemaType.STRING,
      description:
        'Pergunta em português que um comprador em potencial faria a uma IA generativa antes de contratar ou comprar.',
    },
  },
  required: ['text'],
}

function buildProfileContextLines(profile: {
  description: string | null
  industry: string | null
  location: string | null
  targetAudience: string | null
  differentiators: string | null
}): string {
  const lines: string[] = []
  if (profile.industry) lines.push(`Setor: ${profile.industry}`)
  if (profile.location) lines.push(`Localização: ${profile.location}`)
  if (profile.description) lines.push(`O que a empresa faz: ${profile.description}`)
  if (profile.targetAudience) lines.push(`Público-alvo: ${profile.targetAudience}`)
  if (profile.differentiators) lines.push(`Diferenciais: ${profile.differentiators}`)

  return lines.length > 0
    ? `Contexto do negócio:\n${lines.join('\n')}`
    : 'Nenhum contexto adicional de negócio foi fornecido — gere perguntas genéricas para o setor mais provável.'
}

const planSchema = z.object({
  profileId: z.string().uuid(),
  count: z.coerce.number().int().min(MIN_QUESTIONS).max(MAX_QUESTIONS),
})

/** Valida o perfil e devolve o plano de camadas — o client gera uma pergunta por item chamando `generateOneGeoQuestion`. */
export async function prepareGeoQuestionGeneration(input: {
  profileId: string
  count: number
}): Promise<ActionResult<{ layers: QuestionLayer[] }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = planSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: parsed.data.profileId, archivedAt: null },
    select: { id: true },
  })
  if (!profile) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  return { ok: true, data: { layers: buildQuestionPlan(parsed.data.count) } }
}

const singleSchema = z.object({
  profileId: z.string().uuid(),
  layer: z.enum(['DECISAO', 'AVALIACAO', 'PROBLEMA']),
  existingTexts: z.array(z.string()).max(MAX_QUESTIONS).default([]),
})

/** Gera uma única pergunta para a camada pedida, evitando repetir as já geradas nesta sessão. */
export async function generateOneGeoQuestion(input: {
  profileId: string
  layer: QuestionLayer
  existingTexts: string[]
}): Promise<ActionResult<GeneratedQuestion>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = singleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Parâmetros inválidos.', code: 400 }
  }
  const { profileId, layer, existingTexts } = parsed.data

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: profileId, archivedAt: null },
    select: {
      description: true,
      industry: true,
      location: true,
      targetAudience: true,
      differentiators: true,
    },
  })
  if (!profile) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const layerGuidance: Record<QuestionLayer, string> = {
    PROBLEMA: 'A pessoa está reconhecendo uma necessidade ou problema, ainda não busca fornecedores.',
    AVALIACAO: 'A pessoa já sabe o que precisa e está comparando fornecedores ou opções.',
    DECISAO: 'A pessoa está prestes a escolher e contratar um fornecedor específico.',
  }

  const avoidance =
    existingTexts.length > 0
      ? `\n\nNão repita nem parafraseie estas perguntas já geradas:\n${existingTexts.map((t) => `- ${t}`).join('\n')}`
      : ''

  try {
    const result = await generateStructuredContent<GeneratedQuestion>({
      systemInstruction:
        'Você gera perguntas de pesquisa de compra em português do Brasil para medir a visibilidade de uma empresa em IAs generativas. A pergunta deve soar como algo que um cliente em potencial digitaria, nunca mencionar o nome da empresa analisada.',
      prompt: `${buildProfileContextLines(profile)}\n\nGere UMA pergunta para a camada ${layer}. ${layerGuidance[layer]}${avoidance}`,
      schema: QUESTION_JSON_SCHEMA,
    })

    const validated = generatedQuestionSchema.safeParse({ ...result, layer })
    if (!validated.success) {
      return { ok: false, error: 'A IA retornou um formato de pergunta inválido.', code: 502 }
    }

    return { ok: true, data: validated.data }
  } catch (error) {
    const message =
      error instanceof StructuredGenerationError
        ? error.message
        : 'Erro inesperado ao gerar pergunta com IA.'
    return { ok: false, error: message, code: 502 }
  }
}

const MAX_SAVE_BATCH = 50

const saveBatchSchema = z.object({
  profileId: z.string().uuid(),
  questions: z.array(generatedQuestionSchema).min(1).max(MAX_SAVE_BATCH),
})

export async function saveGeneratedGeoQuestions(input: {
  profileId: string
  questions: GeneratedQuestion[]
}): Promise<ActionResult<{ count: number }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = saveBatchSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message, code: 400 }
  }

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: parsed.data.profileId, archivedAt: null },
    select: { id: true },
  })
  if (!profile) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const created = await db.geoTargetQuestion.createManyAndReturn({
    data: parsed.data.questions.map((question) => ({
      profileId: parsed.data.profileId,
      text: question.text,
      layer: question.layer,
    })),
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'CREATE',
    entity: 'GeoTargetQuestion',
    entityId: parsed.data.profileId,
    entityLabel: `${created.length} perguntas geradas por IA`,
    newData: omitSensitive({ questions: created }),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true, data: { count: created.length } }
}
