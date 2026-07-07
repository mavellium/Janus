export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function readingMinutes(words: number): number {
  if (words <= 0) return 0
  return Math.max(1, Math.ceil(words / 200))
}

export function readingTimeFromHtml(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
  return readingMinutes(countWords(text))
}
