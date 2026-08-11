import { describe, expect, it } from 'vitest'
import { MAX_IAG_SCORE, calculateIagScore } from './calculateIagScore'
import type { IagScoreInput } from './geoProbe'

function run(overrides: Partial<IagScoreInput> = {}): IagScoreInput {
  return {
    questionId: 'q1',
    layer: 'DECISAO',
    companyMentioned: false,
    mentionedCompetitorId: null,
    errored: false,
    ...overrides,
  }
}

describe('calculateIagScore', () => {
  it('retorna 0 sem execuções', () => {
    expect(calculateIagScore([]).score).toBe(0)
  })

  it('retorna 100 quando a empresa é citada em todas as perguntas', () => {
    const result = calculateIagScore([
      run({ questionId: 'q1', companyMentioned: true }),
      run({ questionId: 'q2', layer: 'PROBLEMA', companyMentioned: true }),
    ])

    expect(result.score).toBe(MAX_IAG_SCORE)
  })

  it('pondera DECISAO acima de PROBLEMA', () => {
    const decisaoOnly = calculateIagScore([
      run({ questionId: 'q1', layer: 'DECISAO', companyMentioned: true }),
      run({ questionId: 'q2', layer: 'PROBLEMA', companyMentioned: false }),
    ])
    const problemaOnly = calculateIagScore([
      run({ questionId: 'q1', layer: 'DECISAO', companyMentioned: false }),
      run({ questionId: 'q2', layer: 'PROBLEMA', companyMentioned: true }),
    ])

    expect(decisaoOnly.score).toBeGreaterThan(problemaOnly.score)
    expect(decisaoOnly.score).toBe(75)
    expect(problemaOnly.score).toBe(25)
  })

  it('usa a taxa de menção por pergunta quando há vários provedores/modos', () => {
    const result = calculateIagScore([
      run({ questionId: 'q1', companyMentioned: true }),
      run({ questionId: 'q1', companyMentioned: false }),
    ])

    expect(result.score).toBe(50)
    expect(result.byQuestion[0].mentionRate).toBe(0.5)
    expect(result.byQuestion[0].probesCounted).toBe(2)
  })

  it('exclui execuções com erro do cálculo', () => {
    const result = calculateIagScore([
      run({ questionId: 'q1', companyMentioned: true }),
      run({ questionId: 'q2', errored: true }),
    ])

    expect(result.score).toBe(MAX_IAG_SCORE)
    expect(result.erroredProbes).toBe(1)
    expect(result.countedProbes).toBe(1)
  })

  it('calcula share of voice entre empresa e concorrentes', () => {
    const result = calculateIagScore([
      run({ questionId: 'q1', companyMentioned: true }),
      run({ questionId: 'q2', mentionedCompetitorId: 'c1' }),
      run({ questionId: 'q3', mentionedCompetitorId: 'c1' }),
      run({ questionId: 'q4', mentionedCompetitorId: 'c2' }),
    ])

    expect(result.competitorComparison[0]).toEqual({
      competitorId: 'c1',
      mentions: 2,
      shareOfVoice: 50,
    })
    expect(result.mentionedProbes).toBe(1)
  })

  it('nunca ultrapassa o teto de 100', () => {
    const result = calculateIagScore(
      Array.from({ length: 30 }, (_, i) => run({ questionId: `q${i}`, companyMentioned: true })),
    )

    expect(result.score).toBeLessThanOrEqual(MAX_IAG_SCORE)
  })
})
