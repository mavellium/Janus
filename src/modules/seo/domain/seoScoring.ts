import type { PageSignals, SeoCheckResult, SeoCheckSeverity, SeoScoreResult } from './seoCheck'

interface CheckDefinition {
  key: string
  label: string
  severity: SeoCheckSeverity
  maxPoints: number
  evaluate: (signals: PageSignals) => { passed: boolean; message: string; recommendation?: string }
}

const TITLE_MIN = 30
const TITLE_MAX = 60
const DESCRIPTION_MIN = 70
const DESCRIPTION_MAX = 160
const MIN_WORDS = 300
const ALT_COVERAGE_THRESHOLD = 0.9
const MAX_RESPONSE_TIME_MS = 3000

const CHECKS: CheckDefinition[] = [
  {
    key: 'title_tag',
    label: 'Título da página',
    severity: 'critical',
    maxPoints: 10,
    evaluate: ({ title }) => {
      if (!title) {
        return {
          passed: false,
          message: 'A página não possui uma tag <title>.',
          recommendation: `Adicione um título único de ${TITLE_MIN} a ${TITLE_MAX} caracteres descrevendo o conteúdo da página.`,
        }
      }
      const length = title.length
      if (length < TITLE_MIN || length > TITLE_MAX) {
        return {
          passed: false,
          message: `O título tem ${length} caracteres — fora da faixa recomendada de ${TITLE_MIN} a ${TITLE_MAX}.`,
          recommendation: `Ajuste o título para algo entre ${TITLE_MIN} e ${TITLE_MAX} caracteres, mantendo a palavra-chave principal no início.`,
        }
      }
      return { passed: true, message: `Título presente com ${length} caracteres, dentro da faixa ideal.` }
    },
  },
  {
    key: 'meta_description',
    label: 'Meta descrição',
    severity: 'critical',
    maxPoints: 10,
    evaluate: ({ metaDescription }) => {
      if (!metaDescription) {
        return {
          passed: false,
          message: 'A página não possui meta descrição.',
          recommendation: `Adicione uma <meta name="description"> de ${DESCRIPTION_MIN} a ${DESCRIPTION_MAX} caracteres resumindo a página — é o texto exibido nos resultados de busca.`,
        }
      }
      const length = metaDescription.length
      if (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX) {
        return {
          passed: false,
          message: `A meta descrição tem ${length} caracteres — fora da faixa recomendada de ${DESCRIPTION_MIN} a ${DESCRIPTION_MAX}.`,
          recommendation: `Reescreva a meta descrição com ${DESCRIPTION_MIN} a ${DESCRIPTION_MAX} caracteres, com uma chamada clara para o clique.`,
        }
      }
      return { passed: true, message: `Meta descrição presente com ${length} caracteres, dentro da faixa ideal.` }
    },
  },
  {
    key: 'single_h1',
    label: 'Cabeçalho principal (H1)',
    severity: 'important',
    maxPoints: 10,
    evaluate: ({ h1Count }) => {
      if (h1Count === 1) {
        return { passed: true, message: 'A página tem exatamente um H1, como recomendado.' }
      }
      if (h1Count === 0) {
        return {
          passed: false,
          message: 'A página não possui nenhuma tag <h1>.',
          recommendation: 'Adicione um único H1 com o tema principal da página.',
        }
      }
      return {
        passed: false,
        message: `A página tem ${h1Count} tags <h1> — o recomendado é exatamente uma.`,
        recommendation: 'Mantenha apenas um H1 e converta os demais em H2/H3 conforme a hierarquia.',
      }
    },
  },
  {
    key: 'h2_structure',
    label: 'Subtítulos (H2)',
    severity: 'minor',
    maxPoints: 5,
    evaluate: ({ h2Count }) =>
      h2Count > 0
        ? { passed: true, message: `A página usa ${h2Count} subtítulo(s) H2 para organizar o conteúdo.` }
        : {
            passed: false,
            message: 'A página não usa subtítulos H2.',
            recommendation: 'Divida o conteúdo em seções com H2 — melhora a leitura para pessoas e buscadores.',
          },
  },
  {
    key: 'https',
    label: 'Conexão segura (HTTPS)',
    severity: 'critical',
    maxPoints: 10,
    evaluate: ({ finalUrl }) =>
      finalUrl.startsWith('https://')
        ? { passed: true, message: 'O site é servido via HTTPS.' }
        : {
            passed: false,
            message: 'O site não usa HTTPS.',
            recommendation: 'Instale um certificado SSL e redirecione todo o tráfego HTTP para HTTPS — buscadores penalizam sites sem conexão segura.',
          },
  },
  {
    key: 'viewport',
    label: 'Compatibilidade mobile (viewport)',
    severity: 'important',
    maxPoints: 5,
    evaluate: ({ hasViewport }) =>
      hasViewport
        ? { passed: true, message: 'Meta viewport presente — página preparada para dispositivos móveis.' }
        : {
            passed: false,
            message: 'A página não declara meta viewport.',
            recommendation: 'Adicione <meta name="viewport" content="width=device-width, initial-scale=1"> no <head>.',
          },
  },
  {
    key: 'canonical',
    label: 'URL canônica',
    severity: 'minor',
    maxPoints: 5,
    evaluate: ({ canonical }) =>
      canonical
        ? { passed: true, message: 'Link canônico declarado.' }
        : {
            passed: false,
            message: 'A página não declara URL canônica.',
            recommendation: 'Adicione <link rel="canonical"> apontando para a versão preferida da URL, evitando conteúdo duplicado.',
          },
  },
  {
    key: 'open_graph',
    label: 'Open Graph (compartilhamento social)',
    severity: 'important',
    maxPoints: 10,
    evaluate: ({ hasOgTitle, hasOgDescription, hasOgImage }) => {
      const missing: string[] = []
      if (!hasOgTitle) missing.push('og:title')
      if (!hasOgDescription) missing.push('og:description')
      if (!hasOgImage) missing.push('og:image')
      if (missing.length === 0) {
        return { passed: true, message: 'Tags Open Graph completas (título, descrição e imagem).' }
      }
      return {
        passed: false,
        message: `Faltam tags Open Graph: ${missing.join(', ')}.`,
        recommendation: 'Adicione as tags og:title, og:description e og:image — controlam a prévia do site em redes sociais e apps de mensagem.',
      }
    },
  },
  {
    key: 'structured_data',
    label: 'Dados estruturados (JSON-LD)',
    severity: 'minor',
    maxPoints: 5,
    evaluate: ({ jsonLdCount }) =>
      jsonLdCount > 0
        ? { passed: true, message: `${jsonLdCount} bloco(s) de dados estruturados JSON-LD encontrados.` }
        : {
            passed: false,
            message: 'Nenhum dado estruturado (JSON-LD) encontrado.',
            recommendation: 'Adicione marcação Schema.org via JSON-LD (ex: Organization, LocalBusiness) — ajuda buscadores e IAs a entenderem o site.',
          },
  },
  {
    key: 'robots_txt',
    label: 'Arquivo robots.txt',
    severity: 'important',
    maxPoints: 5,
    evaluate: ({ robotsTxtAccessible }) =>
      robotsTxtAccessible
        ? { passed: true, message: 'robots.txt acessível na raiz do domínio.' }
        : {
            passed: false,
            message: 'robots.txt não encontrado na raiz do domínio.',
            recommendation: 'Publique um robots.txt indicando o que pode ser indexado e onde está o sitemap.',
          },
  },
  {
    key: 'sitemap',
    label: 'Sitemap XML',
    severity: 'important',
    maxPoints: 5,
    evaluate: ({ sitemapAccessible }) =>
      sitemapAccessible
        ? { passed: true, message: 'Sitemap XML encontrado.' }
        : {
            passed: false,
            message: 'Nenhum sitemap.xml encontrado (nem referenciado no robots.txt).',
            recommendation: 'Gere um sitemap.xml e referencie-o no robots.txt para acelerar a indexação das páginas.',
          },
  },
  {
    key: 'content_length',
    label: 'Volume de conteúdo',
    severity: 'minor',
    maxPoints: 5,
    evaluate: ({ wordCount }) =>
      wordCount >= MIN_WORDS
        ? { passed: true, message: `A página tem cerca de ${wordCount} palavras de conteúdo.` }
        : {
            passed: false,
            message: `A página tem cerca de ${wordCount} palavras — abaixo do mínimo recomendado de ${MIN_WORDS}.`,
            recommendation: 'Amplie o conteúdo textual da página com informações úteis — páginas muito curtas raramente ranqueiam bem.',
          },
  },
  {
    key: 'image_alt',
    label: 'Texto alternativo em imagens',
    severity: 'important',
    maxPoints: 10,
    evaluate: ({ imageCount, imagesWithAlt }) => {
      if (imageCount === 0) {
        return { passed: true, message: 'A página não possui imagens para avaliar.' }
      }
      const coverage = imagesWithAlt / imageCount
      if (coverage >= ALT_COVERAGE_THRESHOLD) {
        return {
          passed: true,
          message: `${imagesWithAlt} de ${imageCount} imagens possuem texto alternativo.`,
        }
      }
      return {
        passed: false,
        message: `Apenas ${imagesWithAlt} de ${imageCount} imagens possuem texto alternativo (mínimo recomendado: 90%).`,
        recommendation: 'Adicione o atributo alt descritivo em todas as imagens relevantes — essencial para acessibilidade e para buscadores.',
      }
    },
  },
  {
    key: 'response_time',
    label: 'Tempo de resposta',
    severity: 'minor',
    maxPoints: 5,
    evaluate: ({ responseTimeMs }) =>
      responseTimeMs < MAX_RESPONSE_TIME_MS
        ? { passed: true, message: `A página respondeu em ${(responseTimeMs / 1000).toFixed(1)}s.` }
        : {
            passed: false,
            message: `A página demorou ${(responseTimeMs / 1000).toFixed(1)}s para responder (recomendado: abaixo de 3s).`,
            recommendation: 'Otimize o tempo de resposta do servidor: cache, CDN e compressão de recursos.',
          },
  },
]

export function scoreSeo(signals: PageSignals): SeoScoreResult {
  const checks: SeoCheckResult[] = CHECKS.map((definition) => {
    const outcome = definition.evaluate(signals)
    return {
      key: definition.key,
      label: definition.label,
      severity: definition.severity,
      maxPoints: definition.maxPoints,
      passed: outcome.passed,
      points: outcome.passed ? definition.maxPoints : 0,
      message: outcome.message,
      recommendation: outcome.passed ? undefined : outcome.recommendation,
    }
  })

  const score = checks.reduce((sum, check) => sum + check.points, 0)
  return { score, checks }
}

export const MAX_SEO_SCORE = CHECKS.reduce((sum, check) => sum + check.maxPoints, 0)
