import { describe, it, expect } from 'vitest'
import { scoreSeo, MAX_SEO_SCORE } from './seoScoring'
import type { PageSignals } from './seoCheck'

function buildSignals(overrides: Partial<PageSignals> = {}): PageSignals {
  return {
    title: 'Título perfeito para SEO com tamanho ideal aqui',
    metaDescription:
      'Uma meta descrição bem escrita, com tamanho adequado para aparecer completa nos resultados de busca do Google.',
    h1Count: 1,
    h2Count: 3,
    canonical: 'https://exemplo.com.br/',
    hasViewport: true,
    hasOgTitle: true,
    hasOgDescription: true,
    hasOgImage: true,
    jsonLdCount: 1,
    wordCount: 500,
    imageCount: 10,
    imagesWithAlt: 10,
    finalUrl: 'https://exemplo.com.br/',
    responseTimeMs: 800,
    robotsTxtAccessible: true,
    sitemapAccessible: true,
    ...overrides,
  }
}

describe('scoreSeo', () => {
  it('a rubrica soma exatamente 100 pontos', () => {
    expect(MAX_SEO_SCORE).toBe(100)
  })

  it('página perfeita recebe score 100 com todos os checks aprovados', () => {
    const { score, checks } = scoreSeo(buildSignals())
    expect(score).toBe(100)
    expect(checks.every((check) => check.passed)).toBe(true)
    expect(checks.every((check) => check.recommendation === undefined)).toBe(true)
  })

  it('página vazia e insegura recebe score baixo com recomendações', () => {
    const { score, checks } = scoreSeo(
      buildSignals({
        title: null,
        metaDescription: null,
        h1Count: 0,
        h2Count: 0,
        canonical: null,
        hasViewport: false,
        hasOgTitle: false,
        hasOgDescription: false,
        hasOgImage: false,
        jsonLdCount: 0,
        wordCount: 50,
        imageCount: 4,
        imagesWithAlt: 0,
        finalUrl: 'http://exemplo.com.br/',
        responseTimeMs: 5000,
        robotsTxtAccessible: false,
        sitemapAccessible: false,
      })
    )
    expect(score).toBe(0)
    const failed = checks.filter((check) => !check.passed)
    expect(failed.length).toBe(checks.length)
    expect(failed.every((check) => typeof check.recommendation === 'string')).toBe(true)
  })

  it('título fora da faixa de 30-60 caracteres reprova o check title_tag', () => {
    const short = scoreSeo(buildSignals({ title: 'Curto' }))
    const long = scoreSeo(
      buildSignals({ title: 'T'.repeat(61) })
    )
    expect(short.checks.find((check) => check.key === 'title_tag')?.passed).toBe(false)
    expect(long.checks.find((check) => check.key === 'title_tag')?.passed).toBe(false)
  })

  it('mais de um H1 reprova o check single_h1', () => {
    const { checks } = scoreSeo(buildSignals({ h1Count: 3 }))
    expect(checks.find((check) => check.key === 'single_h1')?.passed).toBe(false)
  })

  it('página sem imagens passa no check de alt', () => {
    const { checks } = scoreSeo(buildSignals({ imageCount: 0, imagesWithAlt: 0 }))
    expect(checks.find((check) => check.key === 'image_alt')?.passed).toBe(true)
  })

  it('cobertura de alt de 90% passa; abaixo disso reprova', () => {
    const pass = scoreSeo(buildSignals({ imageCount: 10, imagesWithAlt: 9 }))
    const fail = scoreSeo(buildSignals({ imageCount: 10, imagesWithAlt: 8 }))
    expect(pass.checks.find((check) => check.key === 'image_alt')?.passed).toBe(true)
    expect(fail.checks.find((check) => check.key === 'image_alt')?.passed).toBe(false)
  })

  it('sitemap referenciado no robots.txt conta como acessível via sinal agregado', () => {
    const { checks } = scoreSeo(buildSignals({ sitemapAccessible: true }))
    expect(checks.find((check) => check.key === 'sitemap')?.passed).toBe(true)
  })

  it('pontos de cada check refletem passed (0 quando falha, maxPoints quando passa)', () => {
    const { checks } = scoreSeo(buildSignals({ hasViewport: false }))
    const viewport = checks.find((check) => check.key === 'viewport')
    expect(viewport?.points).toBe(0)
    expect(viewport?.maxPoints).toBe(5)
    const https = checks.find((check) => check.key === 'https')
    expect(https?.points).toBe(https?.maxPoints)
  })
})
