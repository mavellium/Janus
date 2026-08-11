import OpenAI from 'openai'
import type { GeoProbeAdapter, GeoProbeResult, ProbeQuestionParams } from '../../domain/geoProbe'
import { GEO_REQUEST_TIMEOUT_MS, buildGeoSystemInstructions, estimateCostUsdCents } from './shared'

const MODEL = process.env.GEO_OPENAI_MODEL ?? 'gpt-5.5'

const INPUT_COST_PER_MILLION_USD_CENTS = Number(process.env.GEO_OPENAI_INPUT_COST_CENTS ?? 125)
const OUTPUT_COST_PER_MILLION_USD_CENTS = Number(process.env.GEO_OPENAI_OUTPUT_COST_CENTS ?? 1000)

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada.')
    }
    client = new OpenAI({ apiKey, timeout: GEO_REQUEST_TIMEOUT_MS, maxRetries: 1 })
  }
  return client
}

function extractCitedUrls(response: OpenAI.Responses.Response): string[] {
  const urls = new Set<string>()

  for (const item of response.output ?? []) {
    if (item.type !== 'message') continue
    for (const block of item.content ?? []) {
      if (block.type !== 'output_text') continue
      for (const annotation of block.annotations ?? []) {
        if (annotation.type === 'url_citation' && annotation.url) {
          urls.add(annotation.url)
        }
      }
    }
  }

  return [...urls]
}

export const openaiProbeAdapter: GeoProbeAdapter = {
  provider: 'OPENAI',

  async probeQuestion({ question, mode, profile }: ProbeQuestionParams): Promise<GeoProbeResult> {
    const base: Omit<GeoProbeResult, 'rawResponse' | 'citedUrls' | 'costUsdCents' | 'errorMessage'> =
      {
        provider: 'OPENAI',
        mode,
      }

    try {
      const response = await getClient().responses.create({
        model: MODEL,
        instructions: buildGeoSystemInstructions(profile),
        input: question,
        tools: mode === 'LIVE_SEARCH' ? [{ type: 'web_search' }] : undefined,
      })

      return {
        ...base,
        rawResponse: response.output_text ?? '',
        citedUrls: extractCitedUrls(response),
        costUsdCents: response.usage
          ? estimateCostUsdCents(
              response.usage.input_tokens,
              response.usage.output_tokens,
              INPUT_COST_PER_MILLION_USD_CENTS,
              OUTPUT_COST_PER_MILLION_USD_CENTS,
            )
          : null,
        errorMessage: null,
      }
    } catch (error) {
      const message =
        error instanceof OpenAI.APIError
          ? `OpenAI ${error.status ?? ''}: ${error.message}`.trim()
          : error instanceof Error
            ? error.message
            : 'Erro desconhecido ao consultar a OpenAI.'

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
