# GEO — Entidades e Domínio

## Models Prisma

- **GeoTargetProfile** (`geo_target_profiles`) — id, name, description?, industry?, location?, website?, aliases `String[]`, targetAudience?, differentiators?, createdById? (fk→User, SET NULL), archivedAt?, timestamps | relações: GeoTargetQuestion[], GeoCompetitor[], GeoProbeRun[], GeoScoreSnapshot[]. **Raiz de todo o módulo — não depende de `Company`.** Perfil "estilo HubSpot": qualquer negócio pode ser analisado, cadastrado no Janus ou não.
- **GeoTargetQuestion** (`geo_target_questions`) — id, profileId (fk→GeoTargetProfile CASCADE), text, layer, priority, status, timestamps | relações: GeoTargetProfile, GeoProbeRun
- **GeoCompetitor** (`geo_competitors`) — id, profileId (fk→GeoTargetProfile CASCADE), name, aliases `String[]` | relações: GeoTargetProfile, GeoProbeRun
- **GeoProbeRun** (`geo_probe_runs`) — id, profileId (fk→GeoTargetProfile CASCADE), snapshotId?, targetQuestionId, provider, mode, rawResponse (Text), companyMentioned, mentionedCompetitorId?, citedUrls `String[]`, costUsdCents?, errorMessage?, createdAt
- **GeoScoreSnapshot** (`geo_score_snapshots`) — id, profileId (fk→GeoTargetProfile CASCADE), userId?, score (0-100), breakdown Json, competitorComparison Json?, totalCostUsdCents, createdAt

## Enums

- `GeoQuestionLayer` — DECISAO | AVALIACAO | PROBLEMA
- `GeoQuestionStatus` — ACTIVE | ARCHIVED (perguntas usam arquivamento, não delete)
- `GeoProvider` — OPENAI | GEMINI | PERPLEXITY | CLAUDE
- `GeoProbeMode` — MODEL_MEMORY (chamada padrão) | LIVE_SEARCH (ferramenta de busca nativa)

`GeoTargetProfile` não tem enum de status — usa `archivedAt: DateTime?` (soft delete simples, sem enum), diferente do padrão `deletedAt` do resto do projeto (nome escolhido para não colidir semanticamente com "empresa deletada" quando na verdade é só um perfil de análise arquivado).

## `detectMention(input) → { companyMentioned, mentionedCompetitorId }`

Função pura em `domain/detectMention.ts`. Normaliza via `normalizeForMatching()` (NFD → remove diacríticos → caixa baixa → não-alfanuméricos viram espaço) e casa com **limite de palavra**, para `Alfabeto` não casar com `Alfa`. Quando há vários concorrentes, retorna o **citado primeiro** no texto.

`input.companyName`/`input.companyAliases` recebem `profile.name`/`profile.aliases` — os nomes dos campos ficaram genéricos de propósito (não dependem de `Company`).

**Invariante:** é heurística de substring, não compreensão semântica. Testado em `detectMention.spec.ts`.

## `calculateIagScore(runs) → IagScoreResult`

Função pura em `domain/calculateIagScore.ts`. Agrupa execuções por pergunta, calcula a taxa de menção de cada uma e faz média ponderada pela camada de intenção.

- Pesos (`LAYER_WEIGHTS`): DECISAO 3 · AVALIACAO 2 · PROBLEMA 1 — decisão de compra pesa mais.
- Execuções com `errored: true` são **excluídas** do cálculo (contadas em `erroredProbes`).
- `MAX_IAG_SCORE = 100`; sem execuções válidas o score é 0.
- `competitorComparison` = share of voice entre menções da empresa e dos concorrentes.

Testado em `calculateIagScore.spec.ts` (pesos, taxa por pergunta, exclusão de erros, teto de 100).

## `buildProbeContextNote(profile) → string`

Função pura em `domain/buildProbeInstructions.ts`. Monta o prompt de sistema enviado a todo provedor a partir do contexto de negócio do `GeoTargetProfileContext`: adiciona linhas sobre `industry`, `location` e `targetAudience` quando presentes, sempre em cima da instrução-base de "comprador brasileiro pesquisando fornecedores".

**Invariante:** nunca inclui `profile.name` no prompt — a simulação de compra deve ser cega ao nome da empresa analisada, para não induzir a IA a mencioná-la. Testado em `buildProbeInstructions.spec.ts`.

## Interfaces (`domain/geoProbe.ts`)

- `GeoTargetProfileContext` — `{ name, aliases, description, industry, location, website, targetAudience, differentiators }`, todos exceto `name`/`aliases` nullable. Construído a partir do `GeoTargetProfile` do banco em `runRaioX` e passado a cada `probeQuestion()`.
- `GeoProbeAdapter` — contrato que todo provedor implementa: `{ provider, probeQuestion(params) }`
- `ProbeQuestionParams` — `{ question, mode, profile: GeoTargetProfileContext, locale? }`
- `GeoProbeResult` — `{ provider, mode, rawResponse, citedUrls, costUsdCents, errorMessage }`
- `IagScoreInput` / `IagScoreResult` / `IagScoreQuestionBreakdown`
- Labels PT-BR: `LAYER_LABELS`, `PROBE_MODE_LABELS`, `PROVIDER_LABELS`
