import { GoogleGenAI, Type } from '@google/genai'

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

const GEMINI_GENERATION_MODEL = process.env.GEO_GEMINI_MODEL ?? 'gemini-2.5-flash'

/**
 * Gera conteúdo estruturado (JSON) a partir de um prompt, usando o primeiro provedor
 * configurado. Hoje só o Gemini está implementado (único com JSON mode nativo e
 * já configurado no ambiente) — a Perplexity é sempre fundamentada em busca (sem modo
 * "JSON puro" confiável) e a OpenAI pode ser adicionada aqui quando necessário.
 */
export async function generateStructuredContent<T>(params: {
  systemInstruction: string
  prompt: string
  schema: object
}): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new StructuredGenerationError(
      'Nenhum provedor de IA com geração estruturada configurado. Defina GEMINI_API_KEY.',
    )
  }

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
  if (!text) {
    throw new StructuredGenerationError('A IA não retornou conteúdo.')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new StructuredGenerationError('A IA retornou um JSON inválido.')
  }
}

export { Type as GeminiSchemaType }
