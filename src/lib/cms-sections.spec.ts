import { describe, it, expect } from 'vitest'
import {
  getPageData,
  pageMode,
  listSectionKeys,
  listSections,
  getSection,
} from './cms-sections'

describe('cms-sections', () => {
  it('resolves data and mode per block type', () => {
    const advanced = { isAdvanced: true, schemaData: { a: 1 }, contentData: { b: 2 } }
    expect(pageMode(advanced)).toBe('advanced')
    expect(getPageData(advanced)).toEqual({ a: 1 })

    const standard = { isAdvanced: false, schemaData: [], contentData: { b: 2 } }
    expect(pageMode(standard)).toBe('standard')
    expect(getPageData(standard)).toEqual({ b: 2 })
  })

  it('lists sections under a content wrapper (advanced)', () => {
    const data = { name: 'Home', content: { hero: { t: 1 }, faq: { items: [] } } }
    expect(listSectionKeys(data).sort()).toEqual(['faq', 'hero'])
    expect(getSection(data, 'faq')).toEqual({ items: [] })
  })

  it('lists top-level sections and drops metadata (advanced, unwrapped)', () => {
    const data = { name: 'X', slug: 'x', hero: { t: 1 }, cta: { l: 2 } }
    expect(listSectionKeys(data).sort()).toEqual(['cta', 'hero'])
  })

  it('labels standard sections from the schema definition', () => {
    const page = {
      isAdvanced: false,
      schemaData: [{ id: 'sec-hero', name: 'Hero', fields: [] }],
      contentData: { 'sec-hero': { title: 'Olá' } },
    }
    expect(listSections(page)).toEqual([{ key: 'sec-hero', label: 'Hero' }])
    expect(getSection(getPageData(page), 'sec-hero')).toEqual({ title: 'Olá' })
  })

  it('supports dot-path section keys and returns undefined when missing', () => {
    const data = { content: { faq: { items: [{ q: '1' }] } } }
    expect(getSection(data, 'content.faq')).toEqual({ items: [{ q: '1' }] })
    expect(getSection(data, 'nope')).toBeUndefined()
  })
})
