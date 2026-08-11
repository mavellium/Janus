import type { GeoProvider } from '@/generated/prisma/client'
import type { GeoProbeAdapter } from '../../domain/geoProbe'
import { openaiProbeAdapter } from './openaiProbe'
import { geminiProbeAdapter } from './geminiProbe'
import { perplexityProbeAdapter } from './perplexityProbe'
import { groqProbeAdapter } from './groqProbe'

const ADAPTERS: Partial<Record<GeoProvider, GeoProbeAdapter>> = {
  OPENAI: openaiProbeAdapter,
  GEMINI: geminiProbeAdapter,
  PERPLEXITY: perplexityProbeAdapter,
  GROQ: groqProbeAdapter,
}

const API_KEY_ENV: Partial<Record<GeoProvider, string>> = {
  OPENAI: 'OPENAI_API_KEY',
  GEMINI: 'GEMINI_API_KEY',
  PERPLEXITY: 'PERPLEXITY_API_KEY',
  GROQ: 'GROQ_API_KEY',
}

export function getProbeAdapter(provider: GeoProvider): GeoProbeAdapter | null {
  return ADAPTERS[provider] ?? null
}

export function getEnabledProviders(): GeoProvider[] {
  return Object.keys(ADAPTERS) as GeoProvider[]
}

export function isProviderConfigured(provider: GeoProvider): boolean {
  const envVar = API_KEY_ENV[provider]
  return envVar ? Boolean(process.env[envVar]) : false
}

export function getConfiguredProviders(): GeoProvider[] {
  return getEnabledProviders().filter(isProviderConfigured)
}

