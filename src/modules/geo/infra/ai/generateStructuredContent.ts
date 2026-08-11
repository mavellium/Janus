import { GoogleGenAI, Type } from '@google/genai'
import OpenAI from 'openai'
import { groqProbeAdapter } from '../providers/groqProbe'

export class StructuredGenerationError extends Error {}

let geminiClient: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new StructuredGenerationError('GEMINI_API_KEY não configurada.')
    }
    geminiClient = new GoogleGenAI({ apiKey })
  }
  return geminiClient
}

const GEMINI_GENERATION_MODEL = process.env.GEO_GEMINI_MODEL ?? 'gemini-flash-latest'
const GROQ_MODEL = process.env.GEO_GROQ_MODEL ?? 'llama-3.3-70b-versatile'

/**
 * Gera conteúdo estruturado (JSON) a partir de um prompt, tentando primeiro o Gemini.
 * Se o Gemini não estiver configurado ou falhar, utiliza o Groq como fallback (com modo JSON habilitado).
 */
export async function generateStructuredContent<T>(params: {
  systemInstruction: string
  prompt: string
  schema: object
}): Promise<T> {
  // 1. Tenta Gemini se a chave estiver presente
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await getGeminiClient().models.generateContent({
        model: GEMINI_GENERATION_MODEL,
        contents: params.prompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: params.schema,
        },
      })

      const text = response.text
      if (text) {
        return JSON.parse(text) as T
      }
    } catch (error) {
      console.warn(`[generateStructuredContent] Falha no Gemini: ${error instanceof Error ? error.message : error}. Tentando Groq fallback...`)
    }
  }

  // 2. Fallback para o Groq se a GROQ_API_KEY estiver configurada
  if (process.env.GROQ_API_KEY) {
    try {
      const groqClient = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      })

      const schemaPrompt = JSON.stringify(params.schema)

      const response = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `${params.systemInstruction}\n\nVocê DEVE responder estritamente com um objeto JSON válido correspondente à seguinte estrutura/schema:\n${schemaPrompt}`,
          },
          { role: 'user', content: params.prompt },
        ],
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return JSON.parse(content) as T
      }
    } catch (error) {
      throw new StructuredGenerationError(
        `Falha ao gerar conteúdo via Groq: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      )
    }
  }

  throw new StructuredGenerationError(
    'Nenhum provedor de IA com geração estruturada funcional configurado. Defina GEMINI_API_KEY ou GROQ_API_KEY.',
  )
}

export { Type as GeminiSchemaType }
