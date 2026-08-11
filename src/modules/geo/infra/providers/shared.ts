export { buildProbeContextNote as buildGeoSystemInstructions } from '../../domain/buildProbeInstructions'

export const GEO_REQUEST_TIMEOUT_MS = 90_000

export function estimateCostUsdCents(
  inputTokens: number,
  outputTokens: number,
  inputCostPerMillionCents: number,
  outputCostPerMillionCents: number,
): number {
  const cost =
    (inputTokens / 1_000_000) * inputCostPerMillionCents +
    (outputTokens / 1_000_000) * outputCostPerMillionCents
  return Math.round(cost)
}
