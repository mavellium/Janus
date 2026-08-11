import OpenAI from 'openai'
import type { GeoProbeAdapter, GeoProbeResult, ProbeQuestionParams } from '../../domain/geoProbe'
import { GEO_REQUEST_TIMEOUT_MS, buildGeoSystemInstructions, estimateCostUsdCents } from './shared'

const MODEL = process.env.GEO_GROQ_MODEL ?? 'llama-3.3-70b-versatile'

const INPUT_COST_PER_MILLION_USD_CENTS = Number(process.env.GEO_GROQ_INPUT_COST_CENTS ?? 59)
const OUTPUT_COST_PER_MILLION_USD_CENTS = Number(process.env.GEO_GROQ_OUTPUT_COST_CENTS ?? 79)

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY não configurada.')
    }
    client = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
      timeout: GEO_REQUEST_TIMEOUT_MS,
      maxRetries: 1,
    })
  }
  return client
}

export const groqProbeAdapter: GeoProbeAdapter = {
  provider: 'GROQ',

  async probeQuestion({ question, mode, profile }: ProbeQuestionParams): Promise<GeoProbeResult> {
    const base: Omit<GeoProbeResult, 'rawResponse' | 'citedUrls' | 'costUsdCents' | 'errorMessage'> =
      {
        provider: 'GROQ',
        mode,
      }

    try {
      const response = await getClient().chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: buildGeoSystemInstructions(profile) },
          { role: 'user', content: question },
        ],
      })

      const rawResponse = response.choices[0]?.message?.content ?? ''
      const usage = response.usage

      return {
        ...base,
        rawResponse,
        citedUrls: [],
        costUsdCents: usage
          ? estimateCostUsdCents(
              usage.prompt_tokens,
              usage.completion_tokens,
              INPUT_COST_PER_MILLION_USD_CENTS,
              OUTPUT_COST_PER_MILLION_USD_CENTS,
            )
          : null,
        errorMessage: null,
      }
    } catch (error) {
      const message =
        error instanceof OpenAI.APIError
          ? `Groq ${error.status ?? ''}: ${error.message}`.trim()
          : error instanceof Error
            ? error.message
            : 'Erro desconhecido ao consultar o Groq.'

      return {
        ...base,
        rawResponse: '',
        citedUrls: [],
        costUsdCents: null,
        errorMessage: message,
      }
    }
  },
}
