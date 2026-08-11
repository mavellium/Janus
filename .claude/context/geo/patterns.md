# GEO — Padrões Reutilizáveis

## Adicionar um novo provedor de IA

Implemente `GeoProbeAdapter` em `infra/providers/<provedor>Probe.ts` e registre em `infra/providers/index.ts`. O orquestrador `runRaioX` não muda.

```typescript
export const geminiProbeAdapter: GeoProbeAdapter = {
  provider: 'GEMINI',
  async probeQuestion({ question, mode, profile }): Promise<GeoProbeResult> {
    // profile: GeoTargetProfileContext — use buildGeoSystemInstructions(profile) para o prompt
    // mode === 'LIVE_SEARCH' → habilitar a ferramenta de busca nativa do provedor
    // Nunca lançar: erro vira { errorMessage } e sai do cálculo do score.
  },
}
```

Atualize também `isProviderConfigured()` com a env var da credencial — a UI usa isso para desabilitar o botão.

## Como cada provedor implementa os dois modos

Verificado contra os SDKs/APIs oficiais instalados. `buildGeoSystemInstructions()` (re-exporta `buildProbeContextNote` do domain) e `estimateCostUsdCents()` ficam em `infra/providers/shared.ts`.

| Provedor | Chamada | LIVE_SEARCH | Citações | Custo |
| :--- | :--- | :--- | :--- | :--- |
| OPENAI | `responses.create()` (`openai@7`) | `tools: [{ type: 'web_search' }]` | annotations `url_citation` | estimado por tokens |
| GEMINI | `models.generateContent()` (`@google/genai`) | `tools: [{ googleSearch: {} }]` | `groundingMetadata.groundingChunks[].web.uri` | estimado por tokens |
| PERPLEXITY | `POST /chat/completions` (REST, sem SDK) | sempre busca — ver ressalva | `citations[]` + `search_results[].url` | **real**, de `usage.cost.total_cost` |

```typescript
// OpenAI
const response = await getClient().responses.create({
  model: MODEL,
  instructions: buildGeoSystemInstructions(profile),
  input: question,
  tools: mode === 'LIVE_SEARCH' ? [{ type: 'web_search' }] : undefined,
})

// Gemini
const response = await getClient().models.generateContent({
  model: MODEL,
  contents: question,
  config: {
    systemInstruction: buildGeoSystemInstructions(profile),
    ...(mode === 'LIVE_SEARCH' ? { tools: [{ googleSearch: {} }] } : {}),
  },
})
```

## Contexto de negócio no prompt (perfil estilo HubSpot)

`runRaioX` monta um `GeoTargetProfileContext` a partir do `GeoTargetProfile` carregado do banco e passa em `params.profile` para todo `probeQuestion()`. Cada adapter chama `buildGeoSystemInstructions(profile)` para gerar o prompt de sistema — a lógica de quais campos entram no texto vive em `domain/buildProbeInstructions.ts` (`buildProbeContextNote`), não duplicada por provedor.

**Regra importante:** o prompt nunca inclui `profile.name` — só setor/localização/público-alvo, quando preenchidos. Isso mantém a simulação de compra "cega" ao nome da empresa analisada, evitando que a IA cite a empresa só porque ela apareceu no prompt.

**Ressalva do MODEL_MEMORY na Perplexity:** os modelos `sonar` são fundamentados em busca por natureza — não existe modo "memória pura" na API. O modo `MODEL_MEMORY` é, ali, uma aproximação (mesma chamada sem ênfase em busca), não o mesmo mecanismo dos outros dois provedores. Não apresentar os dois modos da Perplexity como equivalentes aos da OpenAI/Gemini em relatório para cliente.

## Geração de conteúdo estruturado (JSON) por IA

`src/modules/geo/infra/ai/generateStructuredContent.ts` expõe `generateStructuredContent<T>({ systemInstruction, prompt, schema })`, usada por `generateOneGeoQuestion` e `suggestOneGeoCompetitor` (uma chamada por item, não em lote — ver seção de progresso item-a-item abaixo). Hoje só o Gemini está implementado ali (único provedor com JSON mode nativo já configurado no ambiente):

```typescript
const response = await getGeminiClient().models.generateContent({
  model: GEMINI_GENERATION_MODEL,
  contents: prompt,
  config: {
    systemInstruction,
    responseMimeType: 'application/json',
    responseSchema: schema, // objeto no formato Schema do @google/genai (usa GeminiSchemaType, não string literal)
  },
})
```

`schema` usa `GeminiSchemaType.OBJECT`/`.ARRAY`/`.STRING` (reexport do enum `Type` do `@google/genai`) — **não é um schema Zod nem JSON Schema padrão**, é o formato próprio da API do Gemini (`Schema` interface, com `type`, `properties`, `items`, `enum`, `required`). A resposta bruta (`response.text`) é um JSON string que ainda precisa passar por `JSON.parse()` e, nas actions, por validação Zod antes de confiar no conteúdo — a IA pode devolver um JSON tecnicamente válido mas fora do formato esperado.

**Padrão de "gerar → revisar → salvar", item a item**: toda geração por IA neste módulo segue três actions, não duas — `prepare*` (valida o perfil, monta o plano do que vai ser pedido, sem chamar IA), `generate/suggestOne*` (uma chamada de IA por item, chamada repetidamente pelo client em loop sequencial) e `save*` (persiste só os itens que o admin aprovou). O client mantém os candidatos gerados em `useState` e vai anexando um a um conforme a Server Action retorna, dando a mesma sensação de progresso do Raio-X (ver `RunProgressPanel`) — nunca gerar tudo numa chamada só nem persistir direto no primeiro passo.

Convite ao próximo item a gerar leva o que já foi gerado nesta sessão (`existingTexts`/`existingNames`) para a IA não repetir. Sugestão de concorrentes pode terminar antes do teto (`suggestOneGeoCompetitor` devolve `competitor: null` quando a IA não tem mais candidatos plausíveis) — o client trata isso como fim natural do loop, não como erro.

**Extensão para outros provedores**: se a OpenAI ou outro provedor precisar virar fonte de geração estruturada, adicione a lógica em `generateStructuredContent.ts` (ex.: `response_format`/`zodResponseFormat` do SDK da OpenAI) escolhendo o provedor pela mesma ordem de prioridade usada em `getConfiguredProviders()` — não crie um adapter novo por call site.

## Wizard de análise (UI)

`AdminGeoClient.tsx` → `AnalyzeWizard` é o único ponto de entrada para gerenciar perguntas e concorrentes — não existe mais UI solta para isso. É uma máquina de estados simples com `step: 'context' | 'competitors' | 'questions' | 'running'`, sem router nem URL própria (tudo em `useState` local ao modal, perdido se ele for fechado antes de confirmar um passo).

Cada passo de geração por IA (`competitors`, `questions`) dispara sua respectiva ação automaticamente ao ser montado, via `useEffect` guardado por uma flag `started` (evita repetir a chamada em re-renders) — não exige um clique "Gerar"/"Sugerir" como os modais antigos exigiam. Confirmar um passo já persiste no banco (`saveSuggestedGeoCompetitors`/`saveGeneratedGeoQuestions`) antes de avançar — o wizard não acumula tudo para salvar só no final, então fechar o modal no meio do caminho não perde o que já foi confirmado nos passos anteriores.

Ao construir um novo passo de "gerar → revisar → confirmar" neste wizard, siga o mesmo formato de `CompetitorsStep`/`QuestionsStep`: componente separado recebendo `started`/`loading`/`candidates`/`included`/`error`/`onStart`/`onBack`/`onCancel`/`onConfirm` como props — mantém `AnalyzeWizard` como orquestrador de estado, sem lógica de renderização de item.

## Guard de ação administrativa

```typescript
const guard = await requireAdmin()
if (!guard.ok) return guard
// guard.actor.userId já considera impersonação
```

## Regra de custo

Antes de qualquer mudança que aumente o número de chamadas (novo provedor, novo modo, mais perguntas), lembre-se: o custo por execução é `perguntas × provedores × modos`. Com os 3 provedores atuais e o teto de 25 perguntas isso chega a **150 chamadas pagas por execução, por empresa**. O teto de 25 perguntas e o cooldown de 1h são guardrails deliberados — não remova sem decisão explícita de produto.
