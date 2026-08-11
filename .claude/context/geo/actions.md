# GEO — Server Actions

Todas passam por `requireAdmin()` (`actions/guard.ts`), que exige `session.user.role === 'ADMIN'` e resolve o usuário efetivo via `getImpersonatedUserId()`. Retorno padrão: `{ ok: true, data? }` | `{ ok: false, error, code? }`.

## createGeoTargetProfile / updateGeoTargetProfile / archiveGeoTargetProfile

- **Validação:** name 2-160 chars obrigatório; description/targetAudience/differentiators até 1000-2000 chars; industry/location até 160; website até 300; todos opcionais viram `null` quando vazios (`optionalText()` helper). `aliases` chega como string separada por vírgula, vira `String[]`.
- `createGeoTargetProfile` seta `createdById` com o usuário efetivo.
- `archiveGeoTargetProfile` faz **soft delete** (`archivedAt: new Date()`), auditado como `DELETE`. Todas as queries de listagem filtram `archivedAt: null`.
- Sem vínculo com `Company` — qualquer nome pode ser cadastrado.

## Execução do Raio-X: prepareRaioXRun / runSingleGeoProbe / finalizeRaioXRun

Desde 2026-08-09, `runRaioX()` (uma única action síncrona que rodava toda a matriz pergunta×provedor×modo num loop server-side, sem feedback até o fim) foi **substituída por três actions** para permitir progresso em tempo real na UI — o client roda o loop e chama uma consulta por vez, atualizando a tela a cada resposta.

1. **`prepareRaioXRun({ profileId, providers?, modes? })`** — valida guardrails e devolve a lista de tarefas, sem persistir nada:
   - Zod: profileId uuid, providers/modes não-vazios (default = `getConfiguredProviders()` e ambos os modos).
   - requireAdmin → checa credencial do(s) provedor(es) → perfil existe (`archivedAt: null`) → **cooldown 1h por profileId** → carrega até 25 perguntas ACTIVE → monta `RaioXTask[]` = produto cartesiano pergunta × provedor × modo.
   - Erros: nenhum provedor configurado → 422 · perfil não encontrado → 404 · nenhuma pergunta ativa → 422 · execução < 1h para o mesmo perfil → 429.

2. **`runSingleGeoProbe({ profileId, questionId, provider, mode })`** — executa **uma** tarefa e persiste imediatamente:
   - Carrega perfil + pergunta + concorrentes → monta `GeoTargetProfileContext` → `adapter.probeQuestion({ question, mode, profile })` → `detectMention()` → cria o `GeoProbeRun` **na hora**, com `snapshotId: null` (ainda não pertence a um snapshot).
   - Retorna o resultado (menção, resposta crua, URLs citadas, custo, erro) para a UI renderizar imediatamente.
   - Chamada pelo client uma vez por `RaioXTask`, sequencialmente — é isso que dá o efeito de "IA respondendo em tempo real".

3. **`finalizeRaioXRun({ profileId, probeRunIds, providers, modes })`** — fecha a execução:
   - Busca os `GeoProbeRun` recém-criados por `id` (só os com `snapshotId: null` do perfil) → `calculateIagScore()` → `$transaction`: cria `GeoScoreSnapshot` + `updateMany` vinculando os probe runs via `snapshotId` → `logAudit(CREATE, GeoScoreSnapshot)` → `revalidatePath`.

**Resiliência inalterada:** falha de provedor não derruba a execução — vira `errorMessage` na probe run e sai do cálculo do score. Cada `runSingleGeoProbe` que falhar simplesmente não entra na lista de `probeRunIds` passada para `finalizeRaioXRun` se a chamada de action inteira falhar (guard/validação); erros do **provedor de IA** (ex.: timeout) são persistidos normalmente com `errorMessage` preenchido e contam no `finalizeRaioXRun`.

## Geração de perguntas por IA: prepareGeoQuestionGeneration / generateOneGeoQuestion / saveGeneratedGeoQuestions

Gera perguntas-alvo por IA a partir do contexto do perfil (`industry`, `location`, `description`, `targetAudience`, `differentiators`), **uma por chamada** (não em lote) para permitir progresso em tempo real na UI — mesmo espírito de `prepareRaioXRun`/`runSingleGeoProbe`.

1. **`prepareGeoQuestionGeneration({ profileId, count })`** — Zod `count` 3-15. Valida o perfil e devolve `layers: GeoQuestionLayer[]` via `buildQuestionPlan()` (`domain/buildQuestionPlan.ts`), que distribui `count` perguntas ciclicamente entre DECISAO/AVALIACAO/PROBLEMA. Não chama IA nem persiste nada.
2. **`generateOneGeoQuestion({ profileId, layer, existingTexts })`** — gera **uma** pergunta para a camada pedida via `generateStructuredContent()` (Gemini, JSON mode), passando `existingTexts` (perguntas já geradas nesta sessão do client) no prompt para evitar repetição/paráfrase. Valida a resposta da IA com Zod antes de devolver — se vier fora do formato esperado, retorna erro 502 em vez de salvar lixo. O client chama isso uma vez por item de `layers`, sequencialmente.
3. **`saveGeneratedGeoQuestions({ profileId, questions })`** — recebe a lista já filtrada pelo usuário (após revisão na UI) e persiste via `createManyAndReturn`, auditado como uma única entrada `CREATE` (`entityLabel: "N perguntas geradas por IA"`).

Não conta para `MAX_QUESTIONS_PER_RUN`/`RUN_COOLDOWN_MS` — esses guardrails são do **probing**, não da autoria de perguntas.

## Sugestão de concorrentes por IA: prepareGeoCompetitorSuggestion / suggestOneGeoCompetitor / saveSuggestedGeoCompetitors

Mesma mecânica item-a-item, para concorrentes (até 8, mínimo prático de 3), incluindo `website` quando a IA souber a URL.

1. **`prepareGeoCompetitorSuggestion({ profileId })`** — valida o perfil e devolve `slots: number` (hoje sempre `MAX_SUGGESTIONS` = 8, é o teto de tentativas do client).
2. **`suggestOneGeoCompetitor({ profileId, existingNames })`** — sugere **um** concorrente ainda não sugerido nesta sessão (`existingNames` evita repetição). Devolve `data.competitor: null` (não é erro) quando a IA sinaliza que não há mais concorrentes plausíveis — o client interpreta isso como fim natural do loop e para antes de atingir `slots`.
3. **`saveSuggestedGeoCompetitors({ profileId, competitors })`** — persiste via `createManyAndReturn`, incluindo `website`.

Só o Gemini está implementado como fonte (`infra/ai/generateStructuredContent.ts`) — a Perplexity fica de fora por ser sempre fundamentada em busca (sem JSON mode confiável) e a OpenAI pode ser adicionada ao helper depois, sem mudar as actions.

## createGeoCompetitor (manual) — agora com website

`manageGeoCompetitors.ts`: `createSchema` ganhou `website` (string opcional, URL, vira `null` se vazio). `deleteGeoCompetitor` inalterado. **Não há action de edição de concorrente** — só criar (manual ou por IA) e remover.

## Forçar Raio-X além do cooldown

`prepareRaioXRun({ profileId, providers?, modes?, force? })` — com `force: true`, ignora o cooldown de 1h (`RUN_COOLDOWN_MS`) e grava um `logAudit(CREATE, GeoScoreSnapshot)` específico ("Raio-X forçado antes do fim do cooldown de 1h") para rastreabilidade, além do log normal que `finalizeRaioXRun` já grava ao final. Sem `force`, o erro 429 de cooldown agora informa o horário exato (`America/Sao_Paulo`) em que a próxima execução libera.

## createGeoQuestion / updateGeoQuestion / archiveGeoQuestion

- **Validação:** `profileId` uuid (antes era `companyId`), text 10-500 chars, layer enum, priority 0-100.
- `createGeoQuestion` valida que o perfil existe (`archivedAt: null`) antes de criar.
- `archiveGeoQuestion` faz **soft delete** (`status: ARCHIVED`), auditado como `DELETE`.
- Todas capturam estado anterior com `findUnique` antes de UPDATE/DELETE e chamam `logAudit` com `omitSensitive()`.

## createGeoCompetitor / deleteGeoCompetitor

- **Validação:** `profileId` uuid (antes era `companyId`).
- `aliases` chega como string separada por vírgula e é transformada em `String[]` pelo Zod.
- `deleteGeoCompetitor` é **hard delete**; as probe runs preservam o histórico via `onDelete: SetNull`.

## Auditoria e reversão

`GeoTargetProfile`, `GeoTargetQuestion` e `GeoCompetitor` estão registrados em `ENTITY_DELEGATES` (`revertAuditAction.ts`), então suportam reversão pelo painel de logs. `GeoScoreSnapshot` e `GeoProbeRun` **não** — são registros imutáveis de execução.

`logAudit()` nessas actions **não** passa `companyId` (o `GeoTargetProfile` não pertence a uma empresa) — os logs ficam sem escopo de tenant, visíveis apenas no painel global do admin.
