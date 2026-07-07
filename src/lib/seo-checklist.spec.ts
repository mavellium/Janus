import { describe, it, expect } from 'vitest'
import { analyzeSeo, seoScore } from './seo-checklist'

describe('analyzeSeo', () => {
  it('warns on short title/description, missing H2 and short content', () => {
    const checks = analyzeSeo({ title: 'Curto', body: '<p>texto</p>' })
    const byId = Object.fromEntries(checks.map((c) => [c.id, c.status]))
    expect(byId.title).toBe('warn')
    expect(byId.description).toBe('warn')
    expect(byId.headings).toBe('warn')
    expect(byId.length).toBe('warn')
  })

  it('warns when an image has no alt', () => {
    const checks = analyzeSeo({ title: 't', body: '<img src="x">' })
    expect(checks.find((c) => c.id === 'alt')?.status).toBe('warn')
    const ok = analyzeSeo({ title: 't', body: '<img src="x" alt="ok">' })
    expect(ok.find((c) => c.id === 'alt')?.status).toBe('pass')
  })

  it('scores a well-optimized article at 100', () => {
    const checks = analyzeSeo({
      title: 'Guia janus de otimizacao para SEO em artigos',
      seoDescription: 'a'.repeat(120),
      seoKeywords: 'janus',
      body: `<h2>Sobre janus</h2><p>${'palavra '.repeat(320)} janus</p><img src="x" alt="ok">`,
    })
    expect(seoScore(checks)).toBe(100)
  })
})
