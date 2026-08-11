# GEO — Sumário Executivo

Raio-X de Visibilidade em IA: testa perguntas-alvo de compra nos provedores de IA generativa, detecta se a empresa (ou um concorrente) foi citada e produz o **IAG Score** 0-100. Implementa a **Fase 1** de `sprint/15-geo-generative-engine-optimization.txt`. **Hoje existe apenas no painel do administrador** (`/dashboard-admin/geo`).

A empresa analisada **não precisa ser um `Company` cadastrado no Janus** — é um perfil próprio (`GeoTargetProfile`), estilo conta do HubSpot, preenchido manualmente pelo admin com nome + contexto de negócio. Esse contexto é injetado no prompt de sistema de todos os provedores.

| Camada  | Conteúdo                                                                                       |
| :------ | :--------------------------------------------------------------------------------------------- |
| Domain  | `detectMention()` · `calculateIagScore()` · `buildProbeContextNote()` · tipos e pesos em `geoProbe.ts` |
| Infra   | adapters `OPENAI` · `GEMINI` · `PERPLEXITY` + registry `getProbeAdapter()` / `getConfiguredProviders()` · `infra/ai/generateStructuredContent.ts` (geração de JSON estruturado via Gemini) |
| Actions | `manageGeoProfiles` (CRUD do perfil) · `prepareRaioXRun`/`runSingleGeoProbe`/`finalizeRaioXRun` (execução incremental, com bypass de cooldown via `force`) · `prepareGeoQuestionGeneration`/`generateOneGeoQuestion`/`saveGeneratedGeoQuestions` e `prepareGeoCompetitorSuggestion`/`suggestOneGeoCompetitor`/`saveSuggestedGeoCompetitors` (geração por IA item-a-item) · CRUD manual de perguntas-alvo e concorrentes (com `website`) · guard `requireAdmin()` |
| Queries | perfis, perguntas ativas, concorrentes, último snapshot, histórico, probe runs por snapshot     |

- [domain.md](domain.md) · [actions.md](actions.md) · [queries.md](queries.md) · [patterns.md](patterns.md) · [changelog.md](changelog.md)

**Para usar este módulo, você deve saber:**

- **`GeoTargetProfile` é a raiz de tudo**, não `Company`. `GeoTargetQuestion`, `GeoCompetitor`, `GeoProbeRun` e `GeoScoreSnapshot` referenciam `profileId`, com `onDelete: Cascade` a partir do perfil.
- **Custo variável real**: cada execução chama APIs pagas — `N perguntas × provedores marcados × 2 modos`. Com 25 perguntas e 3 provedores são **150 chamadas por execução**. Teto de 25 perguntas/execução e cooldown de 1h por perfil.
- **Detecção é heurística, não NLP**: correspondência de nome/apelidos normalizada (sem acento, caixa baixa, limite de palavra). Comunicar como tal — nunca como "a IA entendeu que recomendou X".
- Três provedores implementados: **OPENAI**, **GEMINI**, **PERPLEXITY**. `CLAUDE` segue no enum sem adapter (`getProbeAdapter()` retorna `null`). Provedor sem chave aparece desabilitado na UI e não pode ser selecionado.
- **Contexto de negócio no prompt**: `buildProbeContextNote()` monta o prompt de sistema a partir de `industry`/`location`/`targetAudience` do perfil — **nunca** menciona o nome da empresa analisada diretamente (evita viés na resposta simulada).
- O GEO tem models próprios; **não** reaproveita `SeoAnalysis.checks`. Não confundir com `geoFoundationScoring` do módulo `seo` (Fase 3, checks técnicos de robots.txt/JSON-LD).
- **Execução é incremental, não uma única chamada.** A UI chama `prepareRaioXRun` (monta a lista de tarefas) → `runSingleGeoProbe` uma vez por tarefa, em loop no client, mostrando cada resposta assim que chega → `finalizeRaioXRun` (agrega em `GeoScoreSnapshot`). Cada `GeoProbeRun` é persistido no momento em que é gerado, não em lote no final.
- **Analisar é um wizard de 3 passos, não um botão solto**: `AdminGeoClient.tsx` → `AnalyzeWizard` (contexto → concorrentes → perguntas → execução). Não existe mais UI para gerenciar perguntas/concorrentes fora desse fluxo — cadastro manual e geração por IA acontecem só dentro do wizard, disparadas automaticamente ao entrar em cada passo (sem clique extra "Gerar"/"Sugerir"). Perguntas e concorrentes são gerados **item-a-item** (uma chamada de IA por item, `infra/ai/generateStructuredContent.ts`, Gemini JSON mode) para dar sensação de progresso real, igual ao Raio-X. Concorrentes sugeridos incluem `website` quando a IA souber a URL; concorrentes já salvos entram pré-selecionados e deduplicados por nome contra as novas sugestões.
- **Raio-X pode ser forçado além do cooldown**: `prepareRaioXRun({ ..., force: true })` ignora o cooldown de 1h — usado pelo botão "Forçar nova execução" que aparece na UI quando a tentativa normal esbarra no guardrail. Fica registrado em auditoria separadamente, para diferenciar execução normal de forçada nos logs.
