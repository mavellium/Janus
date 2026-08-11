import { GoogleGenAI } from '@google/genai'
import type { GeoProbeAdapter, GeoProbeResult, ProbeQuestionParams } from '../../domain/geoProbe'
import { buildGeoSystemInstructions, estimateCostUsdCents } from './shared'
import { groqProbeAdapter } from './groqProbe'

const MODEL = process.env.GEO_GEMINI_MODEL ?? 'gemini-flash-latest'

const INPUT_COST_PER_MILLION_USD_CENTS = Number(process.env.GEO_GEMINI_INPUT_COST_CENTS ?? 30)
const OUTPUT_COST_PER_MILLION_USD_CENTS = Number(process.env.GEO_GEMINI_OUTPUT_COST_CENTS ?? 250)

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada.')
    }
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

export const geminiProbeAdapter: GeoProbeAdapter = {
  provider: 'GEMINI',

  async probeQuestion(params: ProbeQuestionParams): Promise<GeoProbeResult> {
    const { question, mode, profile } = params
    try {
      const response = await getClient().models.generateContent({
        model: MODEL,
        contents: question,
        config: {
          systemInstruction: buildGeoSystemInstructions(profile),
          ...(mode === 'LIVE_SEARCH' ? { tools: [{ googleSearch: {} }] } : {}),
        },
      })

      const citedUrls = new Set<string>()
      for (const candidate of response.candidates ?? []) {
        for (const chunk of candidate.groundingMetadata?.groundingChunks ?? []) {
          if (chunk.web?.uri) citedUrls.add(chunk.web.uri)
        }
      }

      const usage = response.usageMetadata

      return {
        provider: 'GEMINI',
        mode,
        rawResponse: response.text ?? '',
        citedUrls: [...citedUrls],
        costUsdCents: usage
          ? estimateCostUsdCents(
              usage.promptTokenCount ?? 0,
              usage.candidatesTokenCount ?? 0,
              INPUT_COST_PER_MILLION_USD_CENTS,
              OUTPUT_COST_PER_MILLION_USD_CENTS,
            )
          : null,
        errorMessage: null,
      }
    } catch (error) {
      // Se houver falha no Gemini e o GROQ_API_KEY estiver configurado, tenta como fallback
      if (process.env.GROQ_API_KEY) {
        console.warn(`[geminiProbe] Gemini falhou, acionando fallback para Groq. Erro: ${error instanceof Error ? error.message : error}`)
        const fallbackResult = await groqProbeAdapter.probeQuestion(params)
        return {
          ...fallbackResult,
          provider: 'GEMINI', // Mantém o provedor rotulado como GEMINI no relatório
        }
      }

      return {
        provider: 'GEMINI',
        mode,
        rawResponse: '',
        citedUrls: [],
        costUsdCents: null,
        errorMessage:
          error instanceof Error ? `Gemini: ${error.message}` : 'Erro desconhecido ao consultar o Gemini.',
      }
    }
  },
}

