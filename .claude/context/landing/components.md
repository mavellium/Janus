# Landing — Componentes

Todos em `src/components/landing/`.

## Client

| Arquivo | O que faz |
| :------ | :-------- |
| `useInView.ts` | `useInView()` (IntersectionObserver, dispara 1× e desconecta), `usePrefersReducedMotion()` (via `useSyncExternalStore`, SSR-safe) e `useIsomorphicLayoutEffect` |
| `Reveal.tsx` | Wrapper de entrada por scroll: alterna `data-lp-reveal` e aceita `delay` para cascata |
| `LandingNav.tsx` | Nav fixa; fundo sólido após 12 px de scroll; âncoras; drawer mobile (Esc fecha); logo light/dark por classe |
| `HeroPipeline.tsx` | A demo. 2 colunas: editor do Janus (esq.) e preview do site **ou** JSON da API (dir., alternado pelo botão "Ver na API"). Cursor do mouse percorre os 4 campos + botão Publicar |
| `ScorePanel.tsx` | Reusa `ScoreRing` (`@/components/seo`) — monta só ao entrar na viewport para a animação disparar na hora certa — + checklist com labels reais do scoring |
| `IagPanel.tsx` | IAG Score com `useCountUp` + barras de share of voice animadas por `width` |
| `ApiTabs.tsx` | 3 abas com os endpoints reais de `/api/v1/content` e a resposta JSON; botão de copiar |

## Server

| Arquivo | O que faz |
| :------ | :-------- |
| `SectionHeading.tsx` | Cabeçalho editorial: índice mono + filete + eyebrow + título + descrição |
| `FaqList.tsx` | 6 perguntas em `<details>` nativo; animação 100% CSS (`.lp-faq`) |
| `LandingFooter.tsx` | Logo, 2 colunas de âncoras, link de acesso |

## Seções da página (`src/app/page.tsx`)

Hero → faixa de números → `01` problema → `02` conteúdo (`#cms`) → `03` SEO (`#seo`) → `04` IA (`#ia`) → `05` recursos (`#operacao`) → `06` fluxo (`#fluxo`) → `07` API (`#api`) → `08` perguntas (`#perguntas`) → CTA → rodapé.

**Detalhes do HeroPipeline**

- Cursor posicionado por `getBoundingClientRect` num layout effect com um mapa de refs por alvo (`titulo`, `cor-0..3`, `foto`, `botao`, `publicar`) — sem state, sem medir na render
- Amostras de cor são **tokens da paleta** (`bg-brand-cta|primary|hover|btn-dark`), não hex arbitrário
- A "foto" é `SiteArtwork`: SVG inline (interior com janela, luz, mobiliário) desenhado só com `var(--brand-*)` + gradientes — sem asset externo, adapta ao dark mode
- Botão Publicar acende quando os 4 campos estão preenchidos; barra inferior vira `no ar · publicado agora`
