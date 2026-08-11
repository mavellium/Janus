import { describe, expect, it } from 'vitest'
import { buildQuestionPlan } from './buildQuestionPlan'

describe('buildQuestionPlan', () => {
  it('gera exatamente `count` camadas', () => {
    expect(buildQuestionPlan(8)).toHaveLength(8)
  })

  it('distribui as camadas ciclicamente começando por DECISAO', () => {
    expect(buildQuestionPlan(5)).toEqual([
      'DECISAO',
      'AVALIACAO',
      'PROBLEMA',
      'DECISAO',
      'AVALIACAO',
    ])
  })

  it('devolve lista vazia para count 0', () => {
    expect(buildQuestionPlan(0)).toEqual([])
  })
})
