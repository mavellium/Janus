# SEO — Changelog

### [2026-07-14] — Escopo por usuário efetivo (impersonation-aware)

**Arquivos**:
- `dashboard/seo/page.tsx`, `dashboard/seo/[analysisId]/page.tsx`, `dashboard/page.tsx`: `ownerId` agora usa o usuário **efetivo** — `getImpersonatedUserId()` quando há impersonation; `undefined` (empresa toda) só para ADMIN/DEVELOPER sem impersonation; caso contrário `session.user.id`

**Razão**: complementa o fix de privacidade abaixo — ao inspecionar um usuário (impersonation), o `role` do admin fazia o escopo vazar para a empresa inteira, mostrando análises de outros usuários.

**Impacto**: ao inspecionar um usuário, o histórico/relatório de SEO reflete só as análises daquele usuário.

### [2026-07-14] — Escopo por usuário nas análises (fix de privacidade)

**Arquivos**:
- `getSeoAnalysis.ts` / `getRecentSeoAnalyses.ts`: novo parâmetro opcional `userId` adicionado ao `where`
- `dashboard/seo/page.tsx`, `dashboard/seo/[analysisId]/page.tsx`, `dashboard/page.tsx` (+ prop `ownerId` em `SeoAnalyzerCard.tsx`): passam `session.user.id` quando `!isPrivilegedRole(session.user.role)`

**Razão**: usuários da mesma empresa viam relatórios/histórico de análises criados por outros usuários (queries filtravam só por `companyId`).

**Impacto**: usuário comum vê apenas as próprias análises (histórico, home e relatório — URL direta de análise alheia → 404); ADMIN/DEVELOPER seguem vendo todas da empresa. Rate limit continua por empresa (inalterado).

### [2026-07-14] — Fix de fetch em produção + redesign SEO+GEO

**Arquivos**:
- `src/lib/security/safe-fetch.ts`: causa original preservada em `SafeFetchError.cause` + logada; 1 retry (800ms) em falha de rede não-timeout; `dns.setDefaultResultOrder('ipv4first')`; novo código `BLOCKED_BY_TARGET` para HTTP 403/429 do site-alvo (distinto de "site fora do ar")
- `src/modules/seo/actions/analyzeSeoUrl.ts`: mensagens de erro atualizadas (não afirma mais "verifique se o site está no ar" quando pode ser bloqueio do lado do site, não do Janus)
- `src/components/seo/useCountUp.ts` (novo), `ScoreRing.tsx` (novo, extraído), `CombinedScoreHeader.tsx` (novo): anéis de SEO e GEO lado a lado com animação de contagem (easeOutCubic, ~900ms), clicáveis → `scrollIntoView` na seção de checklist
- `SeoScoreCard.tsx`: removido o anel próprio (duplicava o número já mostrado no `CombinedScoreHeader`) — agora só checklist
- `SeoUrlInputForm.tsx`: usa `CombinedScoreHeader`; `useEffect` com `scrollIntoView` ao concluir a análise (resultado sempre visível sem scroll manual)
- `dashboard/seo/[analysisId]/page.tsx`: `CombinedScoreHeader` no topo + seções `#seo-details`/`#geo-details`
- Renomeado "Análise de SEO" → "**Análise de SEO e GEO**" em `Sidebar.tsx`, `dashboard/seo/page.tsx`, `SeoAnalyzerCard.tsx`, títulos/metadata

**Razão**: `https://fulltime.com.br/` (e outros sites) falhavam em produção com "Não foi possível acessar essa URL" mas funcionavam localmente. Diagnóstico direto (script contra o domínio real) descartou IPv6 quebrado nesse caso específico (domínio só tem A records) e bloqueio por User-Agent (200 com UA de navegador e com o bot UA do Janus) — a causa real ficava indisponível porque o erro de rede original era descartado antes de virar log. Correção: preservar/logar a causa, tentar 1 retry, e aplicar `ipv4first` como mitigação geral da classe de bug mais comum desse tipo (funciona local, falha em produção por rota IPv6 ausente no servidor).

**Tentativa revertida**: cheguei a instalar `undici` via npm e passar um `Agent({ connect: { family: 4 } })` como `dispatcher` do fetch — quebrou TODAS as requisições (`UND_ERR_INVALID_ARG: invalid onRequestStart method`), incluindo `example.com` que antes funcionava. Causa: incompatibilidade entre a versão do `undici` instalada via npm e a versão bundada internamente no `fetch` nativo do Node. Revertido antes de subir; `dns.setDefaultResultOrder('ipv4first')` é a via oficial sem esse risco. Dependência `undici` removida do `package.json`.

**Impacto**: falhas de rede agora ficam diagnosticáveis via log do servidor (`code`/causa original), falhas transientes se auto-recuperam com 1 retry, e a UI para de afirmar com falsa certeza que "o site está fora do ar" quando pode ser bloqueio anti-bot do lado do site-alvo. UI unificada "SEO e GEO" com os dois scores animados e proeminentes no topo, clicáveis direto para os resultados.

### [2026-07-13] — Fundação Técnica para GEO (task 15, fase 3)

**Arquivos**:
- `src/modules/seo/domain/geoFoundationScoring.ts` (novo): `scoreGeoFoundation()`, rubrica de 100 pts (acesso de robôs de IA 40 · Organization/LocalBusiness 30 · FAQPage 30) + item editorial não pontuado; parser de robots.txt próprio (`parseRobotsGroups`/`isBotBlocked`) com suporte a grupos por user-agent e `Allow` sobrepondo `Disallow` do wildcard
- `src/modules/seo/domain/geoFoundationScoring.spec.ts` (novo): 12 testes
- `src/modules/seo/domain/seoCheck.ts`: `+jsonLdTypes` em `ParsedPage`, `+GeoFoundationSignals`/`GeoFoundationResult`, `SeoAnalysisResult.geoFoundation` obrigatório
- `src/modules/seo/infra/fetchTargetPage.ts`: `+robotsTxtBody` no retorno (corpo do robots.txt, já buscado para o check de sitemap — reaproveitado, sem fetch extra)
- `src/modules/seo/infra/parseHtml.ts`: `+jsonLdTypes` (extrai `@type`/`@graph` dos blocos JSON-LD)
- `src/modules/seo/actions/analyzeSeoUrl.ts`: chama `scoreGeoFoundation` além de `scoreSeo`; persiste `checks` como `{ seo, geoFoundation }` (mudança de formato — ver nota de compatibilidade em domain.md)
- `src/modules/seo/queries/getSeoAnalysis.ts`: `parseStoredChecks()` para ler formato novo e legado (array puro pré-GEO)
- `src/components/seo/SeoUrlInputForm.tsx`: renderiza `SeoScoreCard` também para `geoFoundation`
- `src/app/[companySlug]/dashboard/seo/[analysisId]/page.tsx`: seção "Fundação para GEO" condicional
- `src/modules/seo/domain/seoScoring.spec.ts`: fixture `buildSignals()` ganhou `jsonLdTypes` (campo novo obrigatório em `PageSignals`)

**Razão**: primeira fatia implementável da metodologia GEO (`sprint/15-geo-generative-engine-optimization.txt`, Fase 3 — "Fundação Técnica"), escolhida por reaproveitar 100% da infra de fetch/parse já existente do motor de SEO, sem custo de API de LLM (diferente das Fases 1/6/7 do GEO, que exigem integração paga com 4 provedores de IA — ver riscos documentados no próprio arquivo da task 15).

**Impacto**: mesma chamada de `analyzeSeoUrl` agora devolve também a prontidão do site para ser rastreado/citado por IAs generativas, sem custo adicional de rate limit nem de rede. 21 testes unitários (9 SEO + 12 GEO Foundation) + smoke test e2e confirmando reaproveitamento correto dos sinais (`robotsTxtBody`, `jsonLdTypes`) e serialização JSON round-trip. Fases 1, 2, 4, 5, 6 e 7 do GEO permanecem não implementadas.

### [2026-07-13] — Criação do módulo (tasks 11a + 11b da sprint)

**Arquivos**:
- `prisma/migrations/20260713000000_add_seo_analysis/`: enum `seo_analysis_type` + tabela `seo_analyses` (migration manual + `migrate deploy`, pois o shadow DB do `migrate dev` falha numa migration antiga de guest_posts)
- `src/lib/security/safe-fetch.ts`: fetch SSRF-safe reutilizável (novo)
- `src/modules/seo/{domain,infra,actions,queries}`: motor completo
- `src/components/seo/`: SeoScoreCard, SeoUrlInputForm, SeoAnalyzerCard, ReanalyzeButton
- `src/app/[companySlug]/dashboard/seo/[analysisId]/page.tsx`: relatório completo + histórico
- Dependência nova: `cheerio` (parsing HTML server-side)

**Razão**: primeira ferramenta de diagnóstico self-service do Janus (spec em `sprint/11a` e `sprint/11b`).

**Impacto**: card "Análise de SEO" na home da empresa; 9 testes unitários de scoring; smoke test e2e validou score real (example.com=40) e bloqueio SSRF (127.0.0.1, 169.254.169.254, localhost, ftp://).
