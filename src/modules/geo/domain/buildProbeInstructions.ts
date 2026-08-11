import type { GeoTargetProfileContext } from './geoProbe'

const BASE_INSTRUCTIONS =
  'Você é um consumidor brasileiro pesquisando fornecedores antes de comprar. ' +
  'Responda de forma natural e objetiva, citando nomes de empresas concretas quando fizer sentido. ' +
  'Não invente empresas que você não conhece.'

/**
 * Monta o prompt de sistema a partir do contexto de negócio cadastrado no perfil,
 * para orientar o comprador simulado sobre o setor/mercado em questão sem
 * mencionar diretamente a empresa analisada (evita viés na resposta).
 */
export function buildProbeContextNote(profile: GeoTargetProfileContext): string {
  const lines: string[] = []

  if (profile.industry) {
    lines.push(`O contexto da pesquisa é o setor de ${profile.industry}.`)
  }
  if (profile.location) {
    lines.push(`A busca é relevante para a região de ${profile.location}.`)
  }
  if (profile.targetAudience) {
    lines.push(`O público comprador típico: ${profile.targetAudience}.`)
  }

  if (lines.length === 0) return BASE_INSTRUCTIONS

  return `${BASE_INSTRUCTIONS}\n\n${lines.join(' ')}`
}
