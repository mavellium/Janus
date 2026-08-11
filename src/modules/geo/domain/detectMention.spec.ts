import { describe, expect, it } from 'vitest'
import { detectMention, normalizeForMatching } from './detectMention'

describe('normalizeForMatching', () => {
  it('remove acentos e normaliza caixa e pontuação', () => {
    expect(normalizeForMatching('Construtora São João Ltda.')).toBe('construtora sao joao ltda')
  })

  it('colapsa espaços e símbolos em separadores simples', () => {
    expect(normalizeForMatching('  Alfa-Engenharia  &  Cia  ')).toBe('alfa engenharia cia')
  })
})

describe('detectMention', () => {
  const competitors = [
    { id: 'c1', name: 'Alfa Engenharia', aliases: ['Alfa'] },
    { id: 'c2', name: 'Beta Construções', aliases: [] },
  ]

  it('detecta a empresa mesmo quando a IA escreve sem acentos', () => {
    const result = detectMention({
      responseText: 'Voce pode considerar a Construtora Sao Joao para esse projeto.',
      companyName: 'Construtora São João',
      companyAliases: [],
      competitors,
    })

    expect(result.companyMentioned).toBe(true)
    expect(result.mentionedCompetitorId).toBeNull()
  })

  it('detecta a empresa por apelido cadastrado', () => {
    const result = detectMention({
      responseText: 'A SJ Engenharia atende toda a região.',
      companyName: 'Construtora São João',
      companyAliases: ['SJ Engenharia'],
      competitors,
    })

    expect(result.companyMentioned).toBe(true)
  })

  it('retorna o concorrente citado primeiro na resposta', () => {
    const result = detectMention({
      responseText: 'As melhores são Beta Construções e depois Alfa Engenharia.',
      companyName: 'Construtora São João',
      companyAliases: [],
      competitors,
    })

    expect(result.companyMentioned).toBe(false)
    expect(result.mentionedCompetitorId).toBe('c2')
  })

  it('não casa termo como substring de outra palavra', () => {
    const result = detectMention({
      responseText: 'A empresa Alfabeto Digital nao atua nesse setor.',
      companyName: 'Construtora São João',
      companyAliases: [],
      competitors,
    })

    expect(result.mentionedCompetitorId).toBeNull()
  })

  it('ignora resposta vazia sem quebrar', () => {
    const result = detectMention({
      responseText: '',
      companyName: 'Construtora São João',
      companyAliases: [],
      competitors,
    })

    expect(result.companyMentioned).toBe(false)
    expect(result.mentionedCompetitorId).toBeNull()
  })
})
