import type { GeoProbeAdapter, GeoProbeResult, ProbeQuestionParams } from '../../domain/geoProbe'
import { GEO_REQUEST_TIMEOUT_MS, buildGeoSystemInstructions } from './shared'

const API_URL = 'https://api.perplexity.ai/chat/completions'

// A Perplexity sempre consulta a web; o modo MODEL_MEMORY usa o modelo sem busca
// (`sonar-*` sem `search_mode`) apenas como aproximação — documentado em patterns.md.
const LIVE_SEARCH_MODEL = process.env.GEO_PERPLEXITY_MODEL ?? 'sonar'
const MODEL_MEMORY_MODEL = process.env.GEO_PERPLEXITY_OFFLINE_MODEL ?? 'sonar'

interface PerplexityResponse {
  choices?: { message?: { content?: string } }[]
  citations?: string[]
  search_results?: { url?: string }[]
  usage?: { cost?: { total_cost?: number } }
}

export const perplexityProbeAdapter: GeoProbeAdapter = {
  provider: 'PERPLEXITY',

  async probeQuestion({ question, mode, profile }: ProbeQuestionParams): Promise<GeoProbeResult> {
    const apiKey = process.env.PERPLEXITY_API_KEY

    const failure = (message: string): GeoProbeResult => ({
      provider: 'PERPLEXITY',
      mode,
      rawResponse: '',
      citedUrls: [],
      costUsdCents: null,
      errorMessage: message,
    })

    if (!apiKey) return failure('PERPLEXITY_API_KEY não configurada.')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), GEO_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: mode === 'LIVE_SEARCH' ? LIVE_SEARCH_MODEL : MODEL_MEMORY_MODEL,
          messages: [
            { role: 'system', content: buildGeoSystemInstructions(profile) },
            { role: 'user', content: question },
          ],
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        return failure(`Perplexity ${response.status}: ${body.slice(0, 200)}`.trim())
      }

      const data = (await response.json()) as PerplexityResponse

      const citedUrls = new Set<string>()
      for (const url of data.citations ?? []) {
        if (url) citedUrls.add(url)
      }
      for (const result of data.search_results ?? []) {
        if (result.url) citedUrls.add(result.url)
      }

      const totalCostUsd = data.usage?.cost?.total_cost

      return {
        provider: 'PERPLEXITY',
        mode,
        rawResponse: data.choices?.[0]?.message?.content ?? '',
        citedUrls: [...citedUrls],
        costUsdCents:
          typeof totalCostUsd === 'number' ? Math.round(totalCostUsd * 100) : null,
        errorMessage: null,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return failure('Perplexity: tempo limite excedido.')
      }
      return failure(
        error instanceof Error
          ? `Perplexity: ${error.message}`
          : 'Erro desconhecido ao consultar a Perplexity.',
      )
    } finally {
      clearTimeout(timeout)
    }
  },
}
