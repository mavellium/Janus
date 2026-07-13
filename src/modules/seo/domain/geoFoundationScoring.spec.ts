import { describe, it, expect } from 'vitest'
import { scoreGeoFoundation, MAX_GEO_FOUNDATION_SCORE, AI_CRAWLER_USER_AGENTS } from './geoFoundationScoring'
import type { GeoFoundationSignals } from './seoCheck'

function buildSignals(overrides: Partial<GeoFoundationSignals> = {}): GeoFoundationSignals {
  return {
    robotsTxtBody: 'User-agent: *\nDisallow:\n',
    jsonLdTypes: ['Organization', 'FAQPage'],
    ...overrides,
  }
}

describe('scoreGeoFoundation', () => {
  it('a rubrica automatizada soma exatamente 100 pontos', () => {
    expect(MAX_GEO_FOUNDATION_SCORE).toBe(100)
  })

  it('site liberado para IA e com Organization + FAQPage recebe score 100 nos checks automatizados', () => {
    const { score, checks } = scoreGeoFoundation(buildSignals())
    expect(score).toBe(100)
    expect(checks.find((c) => c.key === 'ai_crawler_access')?.passed).toBe(true)
    expect(checks.find((c) => c.key === 'org_schema')?.passed).toBe(true)
    expect(checks.find((c) => c.key === 'faq_schema')?.passed).toBe(true)
  })

  it('sempre inclui o item editorial "resposta em primeiro lugar" sem afetar a pontuação', () => {
    const { score, checks } = scoreGeoFoundation(buildSignals())
    const tip = checks.find((c) => c.key === 'answer_first_manual')
    expect(tip).toBeDefined()
    expect(tip?.passed).toBe(false)
    expect(tip?.maxPoints).toBe(0)
    expect(score).toBe(100)
  })

  it('Disallow: / para User-agent: * bloqueia todos os robôs de IA', () => {
    const { checks } = scoreGeoFoundation(
      buildSignals({ robotsTxtBody: 'User-agent: *\nDisallow: /\n' })
    )
    const check = checks.find((c) => c.key === 'ai_crawler_access')
    expect(check?.passed).toBe(false)
    expect(check?.message).toContain('GPTBot')
  })

  it('bloqueio específico de GPTBot é detectado mesmo com wildcard liberado', () => {
    const { checks } = scoreGeoFoundation(
      buildSignals({
        robotsTxtBody: 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow:\n',
      })
    )
    const check = checks.find((c) => c.key === 'ai_crawler_access')
    expect(check?.passed).toBe(false)
    expect(check?.message).toContain('GPTBot')
  })

  it('Allow: / específico para um bot sobrepõe o bloqueio do wildcard', () => {
    const { checks } = scoreGeoFoundation(
      buildSignals({
        robotsTxtBody: 'User-agent: GPTBot\nAllow: /\n\nUser-agent: *\nDisallow: /\n',
      })
    )
    const check = checks.find((c) => c.key === 'ai_crawler_access')
    expect(check?.passed).toBe(false)
    expect(check?.message).not.toContain('GPTBot,')
  })

  it('Disallow de subpasta especifica não bloqueia a raiz', () => {
    const { checks } = scoreGeoFoundation(
      buildSignals({ robotsTxtBody: 'User-agent: *\nDisallow: /admin/\n' })
    )
    expect(checks.find((c) => c.key === 'ai_crawler_access')?.passed).toBe(true)
  })

  it('reprova org_schema quando não há Organization nem LocalBusiness', () => {
    const { checks } = scoreGeoFoundation(buildSignals({ jsonLdTypes: ['FAQPage'] }))
    expect(checks.find((c) => c.key === 'org_schema')?.passed).toBe(false)
  })

  it('aceita LocalBusiness como alternativa a Organization', () => {
    const { checks } = scoreGeoFoundation(buildSignals({ jsonLdTypes: ['LocalBusiness'] }))
    expect(checks.find((c) => c.key === 'org_schema')?.passed).toBe(true)
  })

  it('reprova faq_schema quando não há FAQPage', () => {
    const { checks } = scoreGeoFoundation(buildSignals({ jsonLdTypes: ['Organization'] }))
    expect(checks.find((c) => c.key === 'faq_schema')?.passed).toBe(false)
  })

  it('robots.txt vazio não bloqueia nenhum robô (ausência de regra = permitido)', () => {
    const { checks } = scoreGeoFoundation(buildSignals({ robotsTxtBody: '' }))
    expect(checks.find((c) => c.key === 'ai_crawler_access')?.passed).toBe(true)
  })

  it('cobre a lista completa de user-agents de IA conhecidos', () => {
    expect(AI_CRAWLER_USER_AGENTS).toEqual(
      expect.arrayContaining(['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'])
    )
  })
})
