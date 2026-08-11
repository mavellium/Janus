'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/prisma'
import { logAudit, omitSensitive } from '@/lib/audit-logger'
import {
  generateStructuredContent,
  GeminiSchemaType,
  StructuredGenerationError,
} from '../infra/ai/generateStructuredContent'
import { requireAdmin } from './guard'

const ADMIN_GEO_PATH = '/dashboard-admin/geo'

const MAX_SUGGESTIONS = 5

type ActionResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string; code?: number }

export interface SuggestedCompetitor {
  name: string
  aliases: string[]
  website: string | null
}

const suggestedCompetitorSchema = z.object({
  name: z.string().min(2).max(120),
  aliases: z.array(z.string().min(1).max(80)).max(5).default([]),
  website: z
    .string()
    .max(300)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
})

const COMPETITOR_JSON_SCHEMA = {
  type: GeminiSchemaType.OBJECT,
  properties: {
    name: {
      type: GeminiSchemaType.STRING,
      description: 'Nome comercial do concorrente.',
    },
    aliases: {
      type: GeminiSchemaType.ARRAY,
      items: { type: GeminiSchemaType.STRING },
      description: 'Apelidos, siglas ou nomes alternativos pelos quais o concorrente também é conhecido.',
    },
    website: {
      type: GeminiSchemaType.STRING,
      nullable: true,
      description:
        'URL completa do site oficial do concorrente (ex: https://www.exemplo.com.br). Use null se não souber com certeza — nunca invente uma URL.',
    },
  },
  required: ['name', 'aliases'],
}

function buildProfileContextLines(profile: {
  name: string
  description: string | null
  industry: string | null
  location: string | null
  targetAudience: string | null
}): string {
  const lines: string[] = [`Empresa analisada: ${profile.name}`]
  if (profile.industry) lines.push(`Setor: ${profile.industry}`)
  if (profile.location) lines.push(`Localização: ${profile.location}`)
  if (profile.description) lines.push(`O que a empresa faz: ${profile.description}`)
  if (profile.targetAudience) lines.push(`Público-alvo: ${profile.targetAudience}`)
  return lines.join('\n')
}

const planSchema = z.object({
  profileId: z.string().uuid(),
})

/** Valida o perfil e devolve quantos slots de sugestão o client deve pedir (fixo, entre MIN e MAX). */
export async function prepareGeoCompetitorSuggestion(input: {
  profileId: string
}): Promise<ActionResult<{ slots: number }>> {
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

  return { ok: true, data: { slots: MAX_SUGGESTIONS } }
}

const singleSchema = z.object({
  profileId: z.string().uuid(),
  existingNames: z.array(z.string()).max(MAX_SUGGESTIONS).default([]),
})

/**
 * Sugere um único concorrente ainda não sugerido nesta sessão. Pode devolver `null` em
 * `data.competitor` quando a IA não encontra mais concorrentes plausíveis — o client para
 * o loop nesse caso em vez de tratar como erro.
 */
export async function suggestOneGeoCompetitor(input: {
  profileId: string
  existingNames: string[]
}): Promise<ActionResult<{ competitor: SuggestedCompetitor | null }>> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard

  const parsed = singleSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Parâmetros inválidos.', code: 400 }
  }
  const { profileId, existingNames } = parsed.data

  const profile = await db.geoTargetProfile.findFirst({
    where: { id: profileId, archivedAt: null },
    select: { name: true, description: true, industry: true, location: true, targetAudience: true },
  })
  if (!profile) {
    return { ok: false, error: 'Empresa analisada não encontrada', code: 404 }
  }

  const avoidance =
    existingNames.length > 0
      ? `\n\nNão repita estes concorrentes já sugeridos: ${existingNames.join(', ')}. Se não souber mais nenhum concorrente direto plausível, responda com name vazio ("").`
      : ''

  try {
    const result = await generateStructuredContent<{
      name: string
      aliases?: string[]
      website?: string | null
    }>({
      systemInstruction:
        'Você identifica concorrentes diretos reais de uma empresa, em português do Brasil, com base no setor, localização e público-alvo informados. Liste apenas concorrentes plausíveis e conhecidos no mercado — nunca invente nomes fictícios nem URLs de site que você não tenha certeza que existem.',
      prompt: `${buildProfileContextLines(profile)}\n\nSugira UM concorrente direto desta empresa, com o site oficial se souber.${avoidance}`,
      schema: COMPETITOR_JSON_SCHEMA,
    })

    if (!result.name || result.name.trim().length < 2) {
      return { ok: true, data: { competitor: null } }
    }

    const validated = suggestedCompetitorSchema.safeParse(result)
    if (!validated.success) {
      return { ok: false, error: 'A IA retornou um formato de concorrente inválido.', code: 502 }
    }

    return { ok: true, data: { competitor: validated.data } }
  } catch (error) {
    const message =
      error instanceof StructuredGenerationError
        ? error.message
        : 'Erro inesperado ao sugerir concorrente com IA.'
    return { ok: false, error: message, code: 502 }
  }
}

const MAX_SAVE_BATCH = 50

const saveBatchSchema = z.object({
  profileId: z.string().uuid(),
  competitors: z.array(suggestedCompetitorSchema).min(1).max(MAX_SAVE_BATCH),
})

export async function saveSuggestedGeoCompetitors(input: {
  profileId: string
  competitors: SuggestedCompetitor[]
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

  const created = await db.geoCompetitor.createManyAndReturn({
    data: parsed.data.competitors.map((competitor) => ({
      profileId: parsed.data.profileId,
      name: competitor.name,
      aliases: competitor.aliases,
      website: competitor.website,
    })),
  })

  await logAudit({
    userId: guard.actor.userId,
    action: 'CREATE',
    entity: 'GeoCompetitor',
    entityId: parsed.data.profileId,
    entityLabel: `${created.length} concorrentes sugeridos por IA`,
    newData: omitSensitive({ competitors: created }),
  })

  revalidatePath(ADMIN_GEO_PATH)
  return { ok: true, data: { count: created.length } }
}
