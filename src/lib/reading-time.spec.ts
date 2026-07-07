import { describe, it, expect } from 'vitest'
import { countWords, readingMinutes, readingTimeFromHtml } from './reading-time'

describe('reading-time', () => {
  it('counts words ignoring extra whitespace', () => {
    expect(countWords('  hello   world ')).toBe(2)
    expect(countWords('')).toBe(0)
    expect(countWords('   ')).toBe(0)
  })

  it('computes minutes at 200 wpm with a minimum of 1', () => {
    expect(readingMinutes(0)).toBe(0)
    expect(readingMinutes(1)).toBe(1)
    expect(readingMinutes(200)).toBe(1)
    expect(readingMinutes(201)).toBe(2)
  })

  it('derives reading time from html, stripping tags', () => {
    expect(readingTimeFromHtml(`<p>${'word '.repeat(400)}</p>`)).toBe(2)
    expect(readingTimeFromHtml(`<h1>t</h1><p>${'word '.repeat(401)}</p>`)).toBe(3)
    expect(readingTimeFromHtml('<p></p>')).toBe(0)
  })
})
