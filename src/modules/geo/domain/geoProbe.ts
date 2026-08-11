import type { GeoProbeMode, GeoProvider, GeoQuestionLayer } from '@/generated/prisma/client'

export interface GeoCompetitorRef {
  id: string
  name: string
  aliases: string[]
}

/**
 * Contexto de negócio da empresa analisada, preenchido manualmente pelo admin
 * (estilo perfil de conta do HubSpot) — não depende de um Company cadastrado.
 * Injetado tanto no prompt de sistema (para orientar a IA) quanto na detecção
 * de menção (nome + apelidos).
 */
export interface GeoTargetProfileContext {
  name: string
  aliases: string[]
  description: string | null
  industry: string | null
  location: string | null
  website: string | null
  targetAudience: string | null
  differentiators: string | null
}

export interface MentionDetectionInput {
  responseText: string
  companyName: string
  companyAliases: string[]
  competitors: GeoCompetitorRef[]
}

export interface MentionDetectionResult {
  companyMentioned: boolean
  mentionedCompetitorId: string | null
}

export interface GeoProbeResult {
  provider: GeoProvider
  mode: GeoProbeMode
  rawResponse: string
  citedUrls: string[]
  costUsdCents: number | null
  errorMessage: string | null
}

export interface ProbeQuestionParams {
  question: string
  mode: GeoProbeMode
  profile: GeoTargetProfileContext
  locale?: string
}

export interface GeoProbeAdapter {
  provider: GeoProvider
  probeQuestion(params: ProbeQuestionParams): Promise<GeoProbeResult>
}

export interface IagScoreInput {
  questionId: string
  layer: GeoQuestionLayer
  companyMentioned: boolean
  mentionedCompetitorId: string | null
  errored: boolean
}

export interface IagScoreQuestionBreakdown {
  questionId: string
  layer: GeoQuestionLayer
  weight: number
  probesCounted: number
  probesMentioned: number
  mentionRate: number
}

export interface IagScoreResult {
  score: number
  totalProbes: number
  countedProbes: number
  erroredProbes: number
  mentionedProbes: number
  byQuestion: IagScoreQuestionBreakdown[]
  competitorComparison: { competitorId: string; mentions: number; shareOfVoice: number }[]
}

export const LAYER_WEIGHTS: Record<GeoQuestionLayer, number> = {
  DECISAO: 3,
  AVALIACAO: 2,
  PROBLEMA: 1,
}

export const LAYER_LABELS: Record<GeoQuestionLayer, string> = {
  DECISAO: 'Decisão',
  AVALIACAO: 'Avaliação',
  PROBLEMA: 'Problema',
}

export const PROBE_MODE_LABELS: Record<GeoProbeMode, string> = {
  MODEL_MEMORY: 'Memória do modelo',
  LIVE_SEARCH: 'Busca ao vivo',
}

export const PROVIDER_LABELS: Record<GeoProvider, string> = {
  OPENAI: 'OpenAI',
  GEMINI: 'Google Gemini',
  PERPLEXITY: 'Perplexity',
  CLAUDE: 'Anthropic Claude',
  GROQ: 'Groq (Llama 3.3)',
}
