import type { MentionDetectionInput, MentionDetectionResult } from './geoProbe'

export function normalizeForMatching(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function containsTerm(haystack: string, term: string): boolean {
  const normalizedTerm = normalizeForMatching(term)
  if (normalizedTerm.length < 2) return false
  return new RegExp(`(^| )${escapeRegExp(normalizedTerm)}( |$)`).test(haystack)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function firstIndexOfTerm(haystack: string, term: string): number {
  const normalizedTerm = normalizeForMatching(term)
  if (normalizedTerm.length < 2) return -1
  const match = new RegExp(`(^| )${escapeRegExp(normalizedTerm)}( |$)`).exec(haystack)
  return match ? match.index : -1
}

export function detectMention(input: MentionDetectionInput): MentionDetectionResult {
  const haystack = ` ${normalizeForMatching(input.responseText)} `

  const companyTerms = [input.companyName, ...input.companyAliases]
  const companyMentioned = companyTerms.some((term) => containsTerm(haystack, term))

  let mentionedCompetitorId: string | null = null
  let earliestIndex = Number.POSITIVE_INFINITY

  for (const competitor of input.competitors) {
    const terms = [competitor.name, ...competitor.aliases]
    for (const term of terms) {
      const index = firstIndexOfTerm(haystack, term)
      if (index >= 0 && index < earliestIndex) {
        earliestIndex = index
        mentionedCompetitorId = competitor.id
      }
    }
  }

  return { companyMentioned, mentionedCompetitorId }
}
