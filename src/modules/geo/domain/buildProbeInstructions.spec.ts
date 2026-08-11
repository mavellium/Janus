import { describe, expect, it } from 'vitest'
import { buildProbeContextNote } from './buildProbeInstructions'
import type { GeoTargetProfileContext } from './geoProbe'

function profile(overrides: Partial<GeoTargetProfileContext> = {}): GeoTargetProfileContext {
  return {
    name: 'Construtora São João',
    aliases: [],
    description: null,
    industry: null,
    location: null,
    website: null,
    targetAudience: null,
    differentiators: null,
    ...overrides,
  }
}

describe('buildProbeContextNote', () => {
  it('retorna apenas a instrução base sem contexto adicional', () => {
    const note = buildProbeContextNote(profile())
    expect(note).not.toContain('setor')
    expect(note).not.toContain('região')
  })

  it('inclui setor, localização e público quando presentes', () => {
    const note = buildProbeContextNote(
      profile({
        industry: 'construção civil',
        location: 'Campinas-SP',
        targetAudience: 'incorporadoras de médio porte',
      }),
    )
    expect(note).toContain('setor de construção civil')
    expect(note).toContain('região de Campinas-SP')
    expect(note).toContain('incorporadoras de médio porte')
  })

  it('nunca menciona diretamente o nome da empresa analisada (evita viés)', () => {
    const note = buildProbeContextNote(
      profile({ name: 'Construtora São João', industry: 'construção civil' }),
    )
    expect(note).not.toContain('Construtora São João')
  })
})
