import type { GeoFoundationResult, GeoFoundationSignals, SeoCheckResult, SeoCheckSeverity } from './seoCheck'

interface CheckDefinition {
  key: string
  label: string
  severity: SeoCheckSeverity
  maxPoints: number
  evaluate: (signals: GeoFoundationSignals) => { passed: boolean; message: string; recommendation?: string }
}

// Tokens confirmados nas políticas de crawler de cada provedor em 2026 — revisar
// periodicamente, pois novos user-agents de IA são adicionados com frequência.
export const AI_CRAWLER_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
]

interface RobotsGroup {
  agents: string[]
  rules: { type: 'allow' | 'disallow'; path: string }[]
}

function parseRobotsGroups(body: string): RobotsGroup[] {
  const groups: RobotsGroup[] = []
  let current: RobotsGroup | null = null
  let sawRuleInCurrent = false

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    const match = line.match(/^([a-zA-Z-]+)\s*:\s*(.*)$/)
    if (!match) continue

    const directive = match[1].toLowerCase()
    const value = match[2].trim()

    if (directive === 'user-agent') {
      if (!current || sawRuleInCurrent) {
        current = { agents: [], rules: [] }
        groups.push(current)
        sawRuleInCurrent = false
      }
      current.agents.push(value.toLowerCase())
    } else if (directive === 'allow' || directive === 'disallow') {
      if (!current) continue
      current.rules.push({ type: directive, path: value })
      sawRuleInCurrent = true
    }
  }

  return groups
}

function isBotBlocked(groups: RobotsGroup[], botName: string): boolean {
  const lower = botName.toLowerCase()
  const group = groups.find((g) => g.agents.includes(lower)) ?? groups.find((g) => g.agents.includes('*'))
  if (!group) return false

  const rootDisallow = group.rules.some((rule) => rule.type === 'disallow' && rule.path === '/')
  const rootAllow = group.rules.some((rule) => rule.type === 'allow' && rule.path === '/')
  return rootDisallow && !rootAllow
}

function evaluateStructuredDataType(
  jsonLdTypes: string[],
  candidates: string[]
): { passed: boolean; message: string; recommendation?: string } {
  const found = candidates.find((candidate) => jsonLdTypes.includes(candidate))
  if (found) {
    return { passed: true, message: `Dado estruturado ${found} encontrado.` }
  }
  return {
    passed: false,
    message: `Nenhum dado estruturado do tipo ${candidates.join(' ou ')} encontrado.`,
    recommendation: `Adicione marcação Schema.org (JSON-LD) do tipo ${candidates[0]} — ajuda IAs generativas (ChatGPT, Claude, Gemini, Perplexity) a entender e citar sua empresa com precisão.`,
  }
}

const CHECKS: CheckDefinition[] = [
  {
    key: 'ai_crawler_access',
    label: 'Acesso de robôs de IA (robots.txt)',
    severity: 'critical',
    maxPoints: 40,
    evaluate: ({ robotsTxtBody }) => {
      const groups = parseRobotsGroups(robotsTxtBody)
      const blocked = AI_CRAWLER_USER_AGENTS.filter((bot) => isBotBlocked(groups, bot))
      if (blocked.length === 0) {
        return {
          passed: true,
          message: 'Nenhum robô de IA conhecido (GPTBot, ClaudeBot, PerplexityBot, Google-Extended etc.) está bloqueado no robots.txt.',
        }
      }
      return {
        passed: false,
        message: `${blocked.length} robô(s) de IA bloqueado(s) no robots.txt: ${blocked.join(', ')}.`,
        recommendation: 'Remova o bloqueio desses user-agents no robots.txt se você quer que ferramentas de IA generativa possam rastrear e citar seu site nas respostas.',
      }
    },
  },
  {
    key: 'org_schema',
    label: 'Dados estruturados de Organização',
    severity: 'important',
    maxPoints: 30,
    evaluate: ({ jsonLdTypes }) => evaluateStructuredDataType(jsonLdTypes, ['Organization', 'LocalBusiness']),
  },
  {
    key: 'faq_schema',
    label: 'Dados estruturados de Perguntas Frequentes',
    severity: 'minor',
    maxPoints: 30,
    evaluate: ({ jsonLdTypes }) => evaluateStructuredDataType(jsonLdTypes, ['FAQPage']),
  },
]

// Item editorial — não é automatizável com precisão sem uma chamada extra a um LLM
// avaliando o texto; exibido como orientação manual, sem pontuação (maxPoints: 0).
const GEO_ANSWER_FIRST_TIP: SeoCheckResult = {
  key: 'answer_first_manual',
  label: 'Resposta em primeiro lugar (revisão editorial)',
  severity: 'minor',
  maxPoints: 0,
  points: 0,
  passed: false,
  message: 'Este critério exige revisão humana do texto — não é verificado automaticamente.',
  recommendation:
    'Garanta que o primeiro parágrafo das páginas-chave responda diretamente a pergunta do título antes de qualquer contexto — IAs generativas tendem a citar o trecho mais direto da página.',
}

export function scoreGeoFoundation(signals: GeoFoundationSignals): GeoFoundationResult {
  const checks: SeoCheckResult[] = CHECKS.map((definition) => {
    const outcome = definition.evaluate(signals)
    return {
      key: definition.key,
      label: definition.label,
      severity: definition.severity,
      maxPoints: definition.maxPoints,
      passed: outcome.passed,
      points: outcome.passed ? definition.maxPoints : 0,
      message: outcome.message,
      recommendation: outcome.passed ? undefined : outcome.recommendation,
    }
  })

  const score = checks.reduce((sum, check) => sum + check.points, 0)
  return { score, checks: [...checks, GEO_ANSWER_FIRST_TIP] }
}

export const MAX_GEO_FOUNDATION_SCORE = CHECKS.reduce((sum, check) => sum + check.maxPoints, 0)
