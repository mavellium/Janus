# GEO — Changelog

### [2026-08-09] — IA só sugere automaticamente quando a lista está vazia; tetos finais (5 concorrentes, 15 perguntas)

**Bug/comportamento indesejado**: `CompetitorsStep`/`QuestionsStep` chamavam a IA automaticamente **toda vez** que o passo era montado (via `useEffect`), mesmo quando já havia concorrentes/perguntas cadastrados no perfil — se o total de já-cadastrados + sugestões novas estourasse o teto, a lista virava uma bagunça de itens que nem cabiam na análise. Usuário pediu explicitamente: a IA só deve preencher sozinha quando a lista estiver **vazia**; caso já tenha itens, precisa ser uma ação explícita.

**Correção**: separada a lógica de "inicializar o passo" da lógica de "buscar sugestões da IA":

- `initCompetitorCandidates()` — só popula os concorrentes já salvos (`competitors`), sem chamar IA.
- `fetchCompetitorSuggestions(baseCandidates)` — a chamada de IA em si (loop item-a-item), agora reutilizável.
- `initCompetitorsStep()` — roda no `useEffect` de montagem do passo: inicializa candidatos e só dispara `fetchCompetitorSuggestions` **se a lista de concorrentes já salvos estiver vazia**.
- `handleSuggestMoreCompetitors()` — dispara `fetchCompetitorSuggestions` sob demanda, ligado a um novo botão **"Sugerir com IA"** que fica sempre visível ao lado de "Adicionar manualmente" (permite pedir mais sugestões quando quiser, mesmo com a lista não-vazia).
- Mesmo padrão espelhado em perguntas: `fetchQuestionSuggestions()` (a chamada de IA), `initQuestionsStep()` (só dispara automaticamente se `questions.length === 0`, ou seja, nenhuma pergunta-alvo já cadastrada no perfil), `handleSuggestMoreQuestions()` (botão sob demanda).
- Texto explicativo de cada passo agora muda dependendo do estado: quando vazio, explica que a IA vai buscar sozinha; quando já tem itens, convida a pedir mais ou adicionar manualmente.

**Tetos ajustados** (pedido do usuário, após testar 5 e 15 como valores finais):

- `MAX_SUGGESTIONS` (concorrentes, `suggestGeoCompetitors.ts`) e `competitorMaxSlots`/`MAX_COMPETITORS_TOTAL` (client): **5** (era 10, antes disso 4/8).
- `MAX_QUESTIONS_TOTAL` (client): **15**, já era o valor de `MAX_QUESTIONS` no server — sem mudança de servidor, só a constante nova do client para o aviso de limite.
- Aviso visual (banner âmbar) quando o total (já cadastrados + novos candidatos) atinge o teto, em ambos os passos — bloqueia "Adicionar manualmente" e "Sugerir com IA" enquanto o limite estiver atingido.
- `loadCompetitorSuggestions`/`fetchQuestionSuggestions` param de pedir mais sugestões à IA assim que o total bate no teto, em vez de continuar gastando chamadas que seriam descartadas.

**Erro "Erro inesperado ao sugerir concorrente com IA." pendurado**: causa — quando uma chamada individual de `suggestOneGeoCompetitor` falhava no meio do loop, o erro ficava setado mesmo que outras chamadas do mesmo loop tivessem sucesso e a lista já estivesse com itens suficientes. Corrigido: o loop agora usa `continue` em vez de `break` ao encontrar um erro pontual, e só define `competitorError` visível se **nenhum** candidato novo foi obtido em toda a rodada (indicando problema real, não uma falha isolada).

**Foco cortado nos inputs**: containers com `overflow-y-auto` que continham inputs/checkboxes cortavam o anel de foco (`ring`) na borda — `pr-1` trocado por `p-1 -m-1` em `ProfileModal`, no passo de contexto do wizard, e nas listas de candidatos de concorrentes/perguntas (padding extra compensado por margem negativa, sem alterar alinhamento visual).

**Stepper navegável**: as abas do cabeçalho do wizard (Contexto/Concorrentes/Perguntas) viraram `<button>` clicáveis — passos já alcançados (rastreados via novo state `furthestReached`) podem ser revisitados a qualquer momento clicando na aba; passos futuros ainda não alcançados continuam bloqueados.

**Arquivos**: `app/dashboard-admin/geo/AdminGeoClient.tsx` (toda a mudança de comportamento acima), `actions/suggestGeoCompetitors.ts` (`MAX_SUGGESTIONS = 5`).

---

### [2026-08-09] — Foco cortado nos inputs, stepper navegável, tetos ajustados

**Arquivos**:

- `app/dashboard-admin/geo/AdminGeoClient.tsx`: todos os containers `overflow-y-auto` que contêm inputs/checkboxes (`ProfileModal`, passo de contexto do wizard, listas de candidatos de concorrentes/perguntas) trocaram `pr-1` por `p-1 -m-1` — o anel de foco (`ring`) de um input na borda de um container com scroll era cortado pelo `overflow-y-auto` sem padding suficiente; o padding extra compensado por margem negativa dá espaço ao ring sem alterar o alinhamento visual externo.
- `WizardStepper` ganhou navegação: cada pill agora é um `<button>`; passos já alcançados (`i <= furthestReached`) ficam clicáveis e levam de volta a esse passo, o atual fica desabilitado (sem sentido clicar nele), passos futuros ainda não alcançados continuam bloqueados (não dá pra pular a validação/geração de um passo). Novo state `furthestReached` em `AnalyzeWizard` rastreia o passo mais avançado já visitado nesta sessão do wizard; `setStep()` foi envolvido para atualizar essa marca automaticamente.
- `actions/suggestGeoCompetitors.ts`: `MAX_SUGGESTIONS` subiu de 4 para **10** (pedido do usuário). `generateGeoQuestions.ts` já tinha `MAX_QUESTIONS = 15` — nenhuma mudança necessária ali, o teto pedido já estava correto.
- `competitorMaxSlots` (default do client) ajustado de 4 para 10 para acompanhar o novo teto do servidor.

**Razão**: usuário reportou o anel de foco do input "Nome da empresa" visualmente cortado na borda do formulário rolável, pediu para navegar clicando diretamente nas abas do stepper em vez de só usar Voltar/Continuar, e pediu tetos maiores (10 concorrentes, 15 perguntas).

---

### [2026-08-09] — Botão de remover item na lista do wizard + corrigido "Parâmetros inválidos" ao confirmar

**Bug 1**: ao confirmar o passo de concorrentes com uma lista grande (12 candidatos, a maioria duplicatas antigas do bug de corrida anterior), a action `saveSuggestedGeoCompetitors` retornava "Parâmetros inválidos" e travava o wizard. Causa: `saveBatchSchema.competitors` reaproveitava `MAX_SUGGESTIONS` (teto de *quantos a IA sugere por chamada*, reduzido para 4 no changelog anterior) como teto de *quantos itens podem ser salvos de uma vez* — dois conceitos diferentes acoplados no mesmo número. Qualquer lista de concorrentes novos (`!alreadySaved`) com mais de 4 itens (por exemplo, ao adicionar vários manualmente) violava a validação Zod silenciosamente, retornando um erro genérico sem indicar a causa real. Mesmo acoplamento existia em `saveGeneratedGeoQuestions` com `MAX_QUESTIONS`.

**Correção**: `MAX_SAVE_BATCH = 50` desacoplado de `MAX_SUGGESTIONS`/`MAX_QUESTIONS` em ambas as actions — o teto de geração por chamada da IA continua controlando quantas sugestões vêm de uma vez, mas salvar não fica mais preso a esse número.

**Bug 2 (pedido do usuário)**: não havia como remover um item individual da lista de candidatos dentro do wizard — só desmarcar o checkbox (que exclui do save, mas mantém visível, poluindo a tela com duplicatas antigas do banco). Adicionado botão de lixeira em cada linha de `CompetitorsStep`/`QuestionsStep` (`onRemove`), que tira o item do array local (`competitorCandidates`/`generatedQuestions`) — não é uma chamada ao banco, só limpa a lista de candidatos desta sessão do wizard antes de confirmar.

**Arquivos**:

- `actions/suggestGeoCompetitors.ts`, `actions/generateGeoQuestions.ts`: `MAX_SAVE_BATCH = 50` substitui o reaproveitamento de `MAX_SUGGESTIONS`/`MAX_QUESTIONS` no schema de salvamento em lote.
- `app/dashboard-admin/geo/AdminGeoClient.tsx`: `CompetitorsStep`/`QuestionsStep` ganharam prop `onRemove(index)` e botão de lixeira por item; `AnalyzeWizard` ganhou `handleRemoveCompetitor`/`handleRemoveQuestion` (filtram `candidates`/`included` pelo índice).

**Nota**: remover um item "já cadastrado" da lista do wizard **não apaga o registro no banco** — só o tira da lista da sessão atual. Para excluir de fato um concorrente duplicado, ainda é preciso usar a lixeira na lista de concorrentes da página principal (fora do wizard).

---

### [2026-08-09] — Corrigida corrida que duplicava sugestões de concorrentes/perguntas; teto reduzido para 4

**Bug**: usuário reportou concorrentes se repetindo indefinidamente no passo 2 do wizard (ex.: "Agência Mestre" aparecendo 3x idêntico), com "Erro inesperado ao sugerir concorrente com IA" no meio. Causa raiz: `CompetitorsStep`/`QuestionsStep` disparavam a geração via `useEffect(() => { if (!started) onStart() }, [started])`, mas a flag `started` só virava `true` **de forma assíncrona**, dentro da própria função disparada (`setCompetitorsStarted(true)` era a primeira linha de `loadCompetitorSuggestions`, um `async function`). Sob React Strict Mode (ativo por padrão em dev no Next.js, `AdminGeoClient.tsx` nunca desativou), o efeito monta duas vezes — a segunda invocação via a state `started` ainda `false` (a primeira não teve tempo de commitar antes do double-invoke) e disparava uma **segunda cópia do loop de geração em paralelo**, cada uma persistindo suas próprias sugestões no banco.

**Correção**: substituída a guarda por `useRef` (`startedRef`), que é síncrona e sobrevive ao double-invoke do Strict Mode corretamente — é o padrão recomendado pela documentação do React para efeitos de disparo único. O state `competitorsStarted`/`questionsStarted` no componente pai (`AnalyzeWizard`) era redundante com essa proteção e foi removido junto (nunca era de fato necessário, a única defesa real agora vive no `useRef` do componente filho).

**Arquivos**:

- `app/dashboard-admin/geo/AdminGeoClient.tsx`: `CompetitorsStep`/`QuestionsStep` — `useEffect` trocado para usar `useRef` como guarda; prop `started` removida (não é mais necessária, cada step controla sua própria execução única internamente); `AnalyzeWizard` — states `competitorsStarted`/`questionsStarted` removidos.
- `actions/suggestGeoCompetitors.ts`: `MAX_SUGGESTIONS` reduzido de 8 para **4** (pedido do usuário — sugestões de concorrentes limitadas a no máximo 4 por análise).
- `AdminGeoClient.tsx`: `competitorMaxSlots` default do client também ajustado para 4 (era 8), consistente com o novo teto do servidor.

**Impacto**: registros já duplicados no banco por execuções anteriores do bug (times "Agência Mestre" e "Conversion" triplicados em pelo menos um perfil de teste) **não foram limpos automaticamente** — usuário optou por remover manualmente pela UI (botão de lixeira em cada concorrente) quando quiser, em vez de um script de limpeza automático.

**Arquivos**:

- `app/dashboard-admin/geo/AdminGeoClient.tsx`: novos componentes `AddCompetitorForm` e `AddQuestionForm` — mini-formulários inline (nome/site/apelidos para concorrente; texto/camada para pergunta), abertos por um botão "Adicionar manualmente" no topo de cada passo. `CompetitorsStep`/`QuestionsStep` ganharam prop `onAddManual`; `AnalyzeWizard` ganhou `handleAddManualCompetitor` (dedupe por nome normalizado contra sugestões da IA, reaproveitando `normalizeForMatching`) e `handleAddManualQuestion` (append simples, sem dedupe — perguntas não têm identidade única por texto).
- Novo componente `WizardStepper` substitui o indicador de passos inline anterior (números simples) — usa ícones por passo (`Building2`/`Swords`/`Target`), pill preenchida no passo atual, check nos concluídos, conectores entre passos.
- Passo `running`: adicionado cartão de sucesso com ícone grande (`CheckCircle2`) e texto "Análise concluída" ao finalizar, em vez de só uma faixa de texto.
- Conteúdo do wizard envolvido em `<div key={step}>` com `animate-in fade-in slide-in-from-right-2` — cada troca de passo anima levemente em vez de trocar abruptamente.
- `LAYER_ORDER` (removido na reescrita anterior junto com o `QuestionModal` antigo) foi recriado localmente no arquivo, usado pelo seletor de camada do formulário manual de pergunta.

**Razão**: usuário testou o wizard de 3 passos e pediu duas coisas — (1) poder adicionar concorrentes e perguntas manualmente, sem depender só da IA; (2) melhorar a UI/UX geral do modal.

**Impacto**: nenhuma Server Action nova — a entrada manual monta o mesmo formato de dado (`SuggestedCompetitor`/`GeneratedQuestion`) que a geração por IA produz e entra na mesma lista com checkbox, reaproveitando `saveSuggestedGeoCompetitors`/`saveGeneratedGeoQuestions` para persistir. Itens adicionados manualmente não têm o badge "já cadastrado" nem passam por `alreadySaved: true` — são tratados como candidatos novos até o usuário confirmar o passo.

---

### [2026-08-09] — Wizard de análise em 3 passos substitui as seções soltas de gerenciamento

**Arquivos**:

- `app/dashboard-admin/geo/AdminGeoClient.tsx`: reescrito. Novo componente `AnalyzeWizard` (modal com `step: 'context' | 'competitors' | 'questions' | 'running'`) substitui o botão "Rodar Raio-X" solto e os modais independentes `QuestionModal`, `CompetitorModal`, `GenerateQuestionsModal`, `SuggestCompetitorsModal` (todos removidos). Botão da página raiz agora é **"Analisar"**, abre o wizard.

**Fluxo do wizard**:

1. **Contexto** — formulário do perfil (mesmos campos de antes) usando `updateGeoTargetProfile`; ao salvar avança para o passo seguinte.
2. **Concorrentes** — dispara `prepareGeoCompetitorSuggestion` + loop de `suggestOneGeoCompetitor` automaticamente ao entrar no passo (via `useEffect`, sem clique extra). Lista já entra pré-populada com os concorrentes salvos (`alreadySaved: true`, badge "já cadastrado"), concatenados com as sugestões novas da IA — deduplicados por nome normalizado usando `normalizeForMatching()` (reaproveitado de `domain/detectMention.ts`, não duplicado). Ao confirmar, salva só os **novos** marcados via `saveSuggestedGeoCompetitors`.
3. **Perguntas** — perguntas já cadastradas aparecem em lista read-only no topo ("Já cadastradas (N)"); dispara `prepareGeoQuestionGeneration({ count: 10 })` + loop de `generateOneGeoQuestion` automaticamente ao entrar no passo, sempre gerando 10 novas (sem input de quantidade — fixo). Ao confirmar, salva as novas marcadas via `saveGeneratedGeoQuestions` e dispara a execução do Raio-X.
4. **Running** — reaproveita `prepareRaioXRun` → loop `runSingleGeoProbe` → `finalizeRaioXRun` e o componente `RunProgressPanel` (extraído de section para div, encaixado dentro do `DialogContent`), incluindo o botão "Forçar nova execução" em erro 429 de cooldown.

**Razão**: usuário testou o fluxo anterior (seções soltas — botões "Adicionar"/"Gerar com IA" nas perguntas, "Adicionar"/"Sugerir com IA" nos concorrentes, "Rodar Raio-X" separado) e achou fragmentado. Pediu explicitamente um fluxo guiado em modal: revisar contexto → revisar/selecionar concorrentes (com a IA already falando quais são e citando os links) → revisar perguntas existentes + gerar mais 10 novas, antes de rodar a análise.

**Impacto**: a página `/dashboard-admin/geo` fica mais enxuta — mantém seletor/criação de perfil, card de contexto, seletor de provedores de IA (permanece fora do wizard, é config de execução), IAG Score, "Onde a empresa está ausente", "Comparação com concorrentes" e "Histórico". **Gerenciar perguntas/concorrentes isoladamente (fora de uma análise) não é mais possível pela UI** — toda geração/cadastro acontece dentro do wizard, a cada vez que uma análise é iniciada. Nenhuma Server Action, Zod schema, query ou model Prisma mudou — reestruturação puramente de composição de UI.

**Efeito colateral aceito**: o passo 2 sempre chama a IA de novo a cada abertura do wizard (mesmo com concorrentes já salvos) — mais uma rodada de custo de geração por análise, deliberado a pedido do usuário para manter a lista de concorrentes atualizada. Perguntas geradas no passo 3 não são deduplicadas contra as já existentes (só entre si, dentro da mesma geração) — repetição semântica com perguntas antigas é possível.

---

### [2026-08-09] — Geração item-a-item, website do concorrente, forçar execução além do cooldown

**Arquivos**:

- `prisma/schema.prisma`: `GeoCompetitor.website: String?` (novo campo) — migration `20260809052524_add_geo_competitor_website`
- `actions/manageGeoCompetitors.ts`: `createSchema` ganhou `website` (opcional, vira `null` se vazio)
- `queries/getGeoCompetitors.ts`: select inclui `website`
- `actions/generateGeoQuestions.ts`: reescrito para geração **item-a-item**. `generateGeoQuestions`/`saveGeneratedGeoQuestions` viraram `prepareGeoQuestionGeneration({ profileId, count })` (valida perfil, devolve o plano de camadas via `buildQuestionPlan()`) + `generateOneGeoQuestion({ profileId, layer, existingTexts })` (gera **uma** pergunta por chamada, recebe os textos já gerados para não repetir) + `saveGeneratedGeoQuestions` (inalterado, salva em lote)
- `domain/buildQuestionPlan.ts` (novo): `buildQuestionPlan(count)` — distribui `count` perguntas ciclicamente entre DECISAO/AVALIACAO/PROBLEMA. Extraído para o domain porque uma função `export function` síncrona não pode viver num arquivo `'use server'` (Next.js exige que toda exportação de Server Action seja `async`) + `buildQuestionPlan.spec.ts` (3 testes)
- `actions/suggestGeoCompetitors.ts`: mesma reestruturação — `prepareGeoCompetitorSuggestion({ profileId })` (valida perfil, devolve `MAX_SUGGESTIONS` como teto de slots) + `suggestOneGeoCompetitor({ profileId, existingNames })` (sugere **um** concorrente por chamada, incluindo `website` quando a IA souber; devolve `competitor: null` quando a IA não tem mais sugestões plausíveis — client para o loop nesse caso) + `saveSuggestedGeoCompetitors` (inalterado)
- `actions/runRaioX.ts`: `prepareRaioXRun()` ganhou `force?: boolean` — quando `true`, ignora o cooldown de 1h (`RUN_COOLDOWN_MS`) e registra um `logAudit(CREATE, GeoScoreSnapshot)` específico ("Raio-X forçado antes do fim do cooldown de 1h") para rastreabilidade. Mensagem de erro do cooldown agora informa o horário exato em que a próxima execução libera
- `app/dashboard-admin/geo/AdminGeoClient.tsx`: `handleRun(force = false)`; erro de cooldown (código 429) mostra botão "Forçar nova execução" inline; `GenerateQuestionsModal` e `SuggestCompetitorsModal` reescritos para loop client-side (chamam a action "one" repetidamente, cada resultado aparece na lista assim que chega, com animação `fade-in`/`slide-in`); `CompetitorModal` (manual) e a listagem de concorrentes existentes ganharam campo/link de `website`

**Razão**: usuário testou a v1 (uma chamada de IA gerando a lista inteira de uma vez) e pediu explicitamente para "ver o processo criando as perguntas" — queria o mesmo efeito de progresso em tempo real já implementado no Raio-X, também na geração de perguntas/concorrentes. Também pediu a URL do site principal nos concorrentes sugeridos, e uma forma de rerodar o Raio-X sem esperar o cooldown de 1h ao testar.

**Impacto**: gerar N perguntas ou concorrentes agora custa N chamadas de IA em vez de 1 — mais lento e um pouco mais caro, mas dá feedback visual real item-a-item (compensação deliberada, pedida pelo usuário). `suggestOneGeoCompetitor` pode parar antes de atingir `MAX_SUGGESTIONS` se a IA sinalizar que não há mais concorrentes plausíveis (`name` vazio) — o client trata isso como fim natural do loop, não como erro. O bypass de cooldown (`force: true`) é auditado separadamente do snapshot em si, para diferenciar "execução normal" de "execução forçada pelo admin" nos logs.

**Não implementado nesta rodada**: preenchimento automático do `website` do `GeoCompetitor` para concorrentes cadastrados manualmente antes desta mudança (ficam com `website: null` até serem editados) — não há UI de edição de concorrente ainda, só criar/remover.

---

### [2026-08-09] — Execução incremental (progresso em tempo real) + geração de perguntas/concorrentes por IA

**Arquivos**:

- `actions/runRaioX.ts`: reescrito. `runRaioX()` (uma action síncrona rodando toda a matriz pergunta×provedor×modo num loop server-side) virou **três actions**: `prepareRaioXRun()` (valida guardrails, devolve `RaioXTask[]` sem persistir), `runSingleGeoProbe()` (executa e persiste **um** `GeoProbeRun` por chamada, com `snapshotId: null`), `finalizeRaioXRun()` (agrega os probe runs em `GeoScoreSnapshot`, vincula via `updateMany`)
- `infra/ai/generateStructuredContent.ts` (novo): `generateStructuredContent<T>({ systemInstruction, prompt, schema })` — chama `models.generateContent()` do Gemini com `responseMimeType: 'application/json'` + `responseSchema`; reexporta `Type` do `@google/genai` como `GeminiSchemaType`
- `actions/generateGeoQuestions.ts` (novo): `generateGeoQuestions({ profileId, count })` (3-15, gera sem persistir) + `saveGeneratedGeoQuestions({ profileId, questions })` (persiste os aprovados via `createManyAndReturn`)
- `actions/suggestGeoCompetitors.ts` (novo): mesma mecânica para concorrentes (3-8 sugestões)
- `app/dashboard-admin/geo/AdminGeoClient.tsx`: reescrito — `handleRun()` agora chama `prepareRaioXRun` → loop client-side chamando `runSingleGeoProbe` uma tarefa por vez (await sequencial) → `finalizeRaioXRun`; novo componente `RunProgressPanel` mostra barra de progresso, tarefa atual ("Consultando Gemini (busca ao vivo) — <pergunta>") e lista de respostas conforme chegam (ícone de menção/erro + trecho da resposta crua); novos componentes `GenerateQuestionsModal` e `SuggestCompetitorsModal` (gerar → checkboxes de revisão → salvar); botões "Gerar com IA" e "Sugerir com IA" nas seções de Perguntas-alvo e Concorrentes

**Razão**: usuário reportou 3 problemas ao testar a execução real: (1) a tela ficava congelada sem feedback até TODAS as ~150 chamadas terminarem — "quando rodar o raio-x mostrar as coisas, e o agente respondendo em tempo real"; (2) perguntas-alvo eram 100% cadastro manual, sem opção de gerar com IA a partir do contexto do perfil; (3) concorrentes também eram 100% manuais — "concorrentes é a propria i.a que deve achar isso pelo menos 3".

**Impacto**: `GeoProbeRun` passa a ser criado **incrementalmente**, um por chamada de IA, em vez de em lote dentro de uma única transação no final — o registro existe no banco (com `snapshotId: null`) antes do snapshot que o agrega ser criado. `finalizeRaioXRun` só considera probe runs com `snapshotId: null` pertencentes ao perfil e aos IDs informados, então uma execução abandonada no meio (usuário fecha a aba) deixa `GeoProbeRun` órfãos sem `snapshotId` — não afeta o histórico nem o score de execuções futuras, mas não há limpeza automática desses registros órfãos ainda.

Geração de perguntas/concorrentes por IA usa **apenas Gemini** por enquanto (único provedor com JSON mode configurado no ambiente atual) — não conta para o teto de 25 perguntas nem para o cooldown de 1h, que seguem exclusivos do fluxo de *probing*.

**Não implementado nesta rodada**: detecção automática de concorrentes a partir de menções durante o Raio-X (opção descartada em favor do botão dedicado "Sugerir com IA"); streaming token-a-token da resposta da IA (o progresso é por chamada completa, não por token — decisão deliberada para não introduzir SSE/infra nova sem necessidade real).

---

### [2026-08-08] — GeoTargetProfile: análise desacoplada de Company (perfil estilo HubSpot)

**Arquivos**:

- `prisma/schema.prisma`: novo model `GeoTargetProfile` (name, description, industry, location, website, aliases, targetAudience, differentiators, createdById→User, archivedAt); `GeoTargetQuestion`/`GeoCompetitor`/`GeoProbeRun`/`GeoScoreSnapshot` trocaram `companyId`→`profileId` (fk para `GeoTargetProfile`, CASCADE); removidas as back-relations GEO de `Company`; adicionada `User.geoTargetProfiles`
- `domain/geoProbe.ts`: novo tipo `GeoTargetProfileContext`; `ProbeQuestionParams` ganhou `profile: GeoTargetProfileContext`
- `domain/buildProbeInstructions.ts` (novo): `buildProbeContextNote()` — monta o prompt de sistema a partir do contexto do perfil, nunca menciona `profile.name`
- `infra/providers/shared.ts`: `GEO_SYSTEM_INSTRUCTIONS` (constante) virou `buildGeoSystemInstructions` (re-export de `buildProbeContextNote`)
- `infra/providers/{openai,gemini,perplexity}Probe.ts`: `probeQuestion` passou a receber `profile` e chamar `buildGeoSystemInstructions(profile)`
- `actions/manageGeoProfiles.ts` (novo): `createGeoTargetProfile`/`updateGeoTargetProfile`/`archiveGeoTargetProfile`
- `actions/manageGeoQuestions.ts`, `manageGeoCompetitors.ts`, `runRaioX.ts`: `companyId`→`profileId` em todo lugar; `runRaioX` monta `GeoTargetProfileContext` do perfil e usa `profile.name`/`profile.aliases` na detecção de menção
- `queries/getGeoTargetProfiles.ts` (novo): `getGeoTargetProfiles()`, `getGeoTargetProfileById()`
- `queries/{getGeoTargetQuestions,getGeoCompetitors,getGeoSnapshot}.ts`: parâmetro renomeado para `profileId`
- `revertAuditAction.ts`: `GeoTargetProfile` adicionado a `ENTITY_DELEGATES`
- `dashboard-admin/geo/page.tsx` + `AdminGeoClient.tsx`: reescritos — seletor de perfil (não mais de `Company`), `ProfileModal` com formulário completo de contexto de negócio, empty state "cadastrar primeira empresa"
- `components/ui/textarea.tsx` (novo): componente shadcn/ui padrão, faltava no projeto

**Razão**: pedido explícito do usuário — a empresa analisada não precisa estar cadastrada no Janus como `Company`; deve ser possível analisar qualquer negócio informando nome + contexto (o que faz, setor, localização, site, público-alvo, diferenciais), no estilo de um perfil de conta do HubSpot.

**Impacto**: mudança de arquitetura no módulo GEO — toda a árvore de entidades (perguntas, concorrentes, probe runs, snapshots) migrou de `companyId` para `profileId`. Tabelas GEO estavam vazias (feature nunca usada em produção), então a migration (`20260808214051_geo_target_profile`) fez `DROP COLUMN company_id` / `ADD COLUMN profile_id NOT NULL` sem risco de perda de dados — confirmado com contagem de linhas antes de aplicar. Nenhuma outra entidade do projeto foi afetada.

**Efeito colateral no prompt de IA**: antes o prompt de sistema era fixo (`GEO_SYSTEM_INSTRUCTIONS`); agora é gerado por `buildProbeContextNote()` com base no setor/localização/público do perfil, então respostas devem ficar mais direcionadas ao contexto de mercado correto — vale reavaliar a qualidade da detecção de menção após uso real.

---

### [2026-08-06] — Provedores Gemini e Perplexity + migration aplicada

**Arquivos**:

- `infra/providers/shared.ts` (novo): `GEO_SYSTEM_INSTRUCTIONS`, `GEO_REQUEST_TIMEOUT_MS`, `estimateCostUsdCents()` compartilhados
- `infra/providers/geminiProbe.ts` (novo): `@google/genai`, `models.generateContent()`, LIVE_SEARCH via `tools: [{ googleSearch: {} }]`, citações de `groundingMetadata.groundingChunks[].web.uri`
- `infra/providers/perplexityProbe.ts` (novo): REST `POST /chat/completions` com `fetch` + `AbortController` (sem SDK — a API é compatível com o formato OpenAI), citações de `citations[]`/`search_results[]`, **custo real** de `usage.cost.total_cost`
- `infra/providers/index.ts`: registry com 3 adapters + `getConfiguredProviders()` e `API_KEY_ENV`
- `openaiProbe.ts`: refatorado para usar `shared.ts`
- `actions/runRaioX.ts`: default passou de `['OPENAI']` para `getConfiguredProviders()`; erro 422 se nenhum provedor tiver chave
- `dashboard-admin/geo/page.tsx` + `AdminGeoClient.tsx`: seleção de provedores por checkbox (desabilitado sem chave) + estimativa de consultas por execução
- `.env.example`: `GEMINI_API_KEY`, `PERPLEXITY_API_KEY` e respectivos modelos/custos

**Razão**: pedido de habilitar Gemini e Perplexity além da OpenAI.

**Impacto**: custo por execução passou de `perguntas × 2` para até `perguntas × 3 × 2` — com 25 perguntas, **150 chamadas pagas por execução**. A UI agora mostra a contagem estimada antes de rodar. Provedor sem chave não pode ser marcado.

**Ressalva registrada**: a Perplexity (`sonar`) é sempre fundamentada em busca; o modo `MODEL_MEMORY` ali é aproximação, não equivalente ao dos outros provedores (ver `patterns.md`).

**CLAUDE segue não implementado** — no enum e no `PROVIDER_ENV` da UI, sem adapter.

---

### [2026-08-06] — Reparo do histórico de migrações (pré-existente, destravou a migration do GEO)

`npx prisma migrate dev` falhava com **P3006/P3018** ao aplicar a migration do GEO. Causa: tabelas e colunas criadas historicamente via `prisma db push` **sem migração correspondente** — o banco real estava íntegro, mas o histórico não replicava do zero no shadow database. Nada disso foi introduzido pelo módulo GEO.

Migrations de reparo criadas (todas idempotentes, marcadas com `migrate resolve --applied`; nenhum dado perdido):

- `20260515024917_add_guest_tables` — `guest_entries`, `guest_posts`
- `20260519999999_add_blog_and_script_tables` — 5 tabelas de blog + `site_scripts` + enums `blog_post_status`/`script_position`
- `20260523999998_add_missing_company_project_page_columns` — 13 colunas de `companies`/`projects`/`pages`
- `20260523999999_add_missing_user_columns` — 5 colunas de `users` (incl. `permissions`, lida pela migration de `user_companies`)
- `20260716000000_fix_developer_role_and_cascade_fks` — variante `DEVELOPER` do enum `user_role`, FKs `RESTRICT`→`CASCADE`, índice `users_created_by_id_idx`

**Validação**: replay completo do histórico em banco descartável passou a reproduzir o banco real com **zero divergência** (195 colunas em ambos), e `prisma migrate status` reporta "Database schema is up to date!".

---

### [2026-08-06] — Implementação inicial (Fase 1 — Raio-X, somente painel admin)

**Arquivos**:

- `prisma/schema.prisma`: models `GeoTargetQuestion`, `GeoCompetitor`, `GeoProbeRun`, `GeoScoreSnapshot` + enums `GeoQuestionLayer`, `GeoQuestionStatus`, `GeoProvider`, `GeoProbeMode`; back-relations em `Company`
- `src/modules/geo/domain/`: `geoProbe.ts` (tipos/pesos), `detectMention.ts`, `calculateIagScore.ts` + specs (14 testes)
- `src/modules/geo/infra/providers/`: `openaiProbe.ts` (Responses API), `index.ts` (registry)
- `src/modules/geo/actions/`: `guard.ts`, `runRaioX.ts`, `manageGeoQuestions.ts`, `manageGeoCompetitors.ts`
- `src/modules/geo/queries/`: `getGeoTargetQuestions.ts`, `getGeoCompetitors.ts`, `getGeoSnapshot.ts`
- `src/app/dashboard-admin/geo/`: `page.tsx`, `AdminGeoClient.tsx`
- `src/components/admin/AdminSidebar.tsx`: item "Raio-X IA"
- `src/modules/admin/actions/revertAuditAction.ts`: `GeoTargetQuestion` e `GeoCompetitor` em `ENTITY_DELEGATES`
- `.env.example`: `OPENAI_API_KEY`, `GEO_OPENAI_MODEL`, custos por token

**Razão**: implementar o guia de visibilidade em IA (AEO/GEO). O guia original propõe stack Python/FastAPI/Pinecone; foi traduzido para a stack obrigatória do projeto (Next 16 + Server Actions + Prisma), conforme CLAUDE.md.

**Impacto**: novo domínio isolado; nada do módulo `seo` foi alterado. O `geoFoundationScoring` (Fase 3 — checks técnicos) segue no módulo `seo` e é independente deste.

**Escopo deliberadamente não implementado**:

- Provedores GEMINI / PERPLEXITY / CLAUDE — enum e registry prontos, sem adapter *(GEMINI e PERPLEXITY implementados depois, ver entrada acima; CLAUDE segue pendente)*
- Chatbot RAG e crawler de vetorização do guia — fora do painel admin e exigiriam banco vetorial que o projeto não usa
- Visão do cliente (fora de `/dashboard-admin`) e ciclo mensal automatizado (Fase 7 — daemon)
