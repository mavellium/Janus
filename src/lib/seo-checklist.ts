export type SeoStatus = 'pass' | 'warn'

export interface SeoCheck {
  id: string
  label: string
  status: SeoStatus
  detail: string
}

export interface SeoInput {
  title: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  body: string
}

function textFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
}

export function analyzeSeo(input: SeoInput): SeoCheck[] {
  const checks: SeoCheck[] = []

  const effectiveTitle = (input.seoTitle || input.title || '').trim()
  checks.push({
    id: 'title',
    label: 'Título SEO (30–60 caracteres)',
    status: effectiveTitle.length >= 30 && effectiveTitle.length <= 60 ? 'pass' : 'warn',
    detail: `${effectiveTitle.length} caracteres`,
  })

  const description = (input.seoDescription || '').trim()
  checks.push({
    id: 'description',
    label: 'Meta descrição (70–160 caracteres)',
    status: description.length >= 70 && description.length <= 160 ? 'pass' : 'warn',
    detail: description.length === 0 ? 'vazia' : `${description.length} caracteres`,
  })

  const words = textFromHtml(input.body).trim().split(/\s+/).filter(Boolean).length
  checks.push({
    id: 'length',
    label: 'Conteúdo com 300+ palavras',
    status: words >= 300 ? 'pass' : 'warn',
    detail: `${words} palavras`,
  })

  const hasH2 = /<h2[\s>]/i.test(input.body)
  checks.push({
    id: 'headings',
    label: 'Ao menos um subtítulo (H2)',
    status: hasH2 ? 'pass' : 'warn',
    detail: hasH2 ? 'ok' : 'nenhum H2',
  })

  const images = input.body.match(/<img\b[^>]*>/gi) ?? []
  const missingAlt = images.filter(
    (tag) => !/\balt\s*=\s*("[^"]*"|'[^']*')/i.test(tag),
  )
  checks.push({
    id: 'alt',
    label: 'Imagens com texto alternativo (alt)',
    status: missingAlt.length === 0 ? 'pass' : 'warn',
    detail: images.length === 0 ? 'sem imagens' : `${missingAlt.length} sem alt`,
  })

  const keyword = (input.seoKeywords || '').split(',')[0]?.trim().toLowerCase() ?? ''
  if (keyword) {
    const inTitle = effectiveTitle.toLowerCase().includes(keyword)
    const inBody = textFromHtml(input.body).toLowerCase().includes(keyword)
    checks.push({
      id: 'keyword',
      label: 'Palavra-chave no título e no texto',
      status: inTitle && inBody ? 'pass' : 'warn',
      detail: !inTitle ? 'ausente no título' : !inBody ? 'ausente no texto' : 'ok',
    })
  }

  return checks
}

export function seoScore(checks: SeoCheck[]): number {
  if (checks.length === 0) return 0
  const passed = checks.filter((check) => check.status === 'pass').length
  return Math.round((passed / checks.length) * 100)
}
