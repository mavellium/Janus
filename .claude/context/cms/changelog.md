# 📝 Histórico de Alterações (Changelog)

**Instrução**: Adicione uma entry AQUI toda vez que mexer no CMS.

**Formato**:
```markdown
### [YYYY-MM-DD] — Descrição breve

**Arquivos**:
- `path/to/file.ts`: mudança (1 linha)

**Razão**: Por que foi necessário (1-2 linhas)

**Impacto**: Como afeta o fluxo (1-2 linhas)
```

---

### [2026-05-22] — Docs: Painel de documentação in-app reescrito (Padrões Essenciais + Prompt IA)

**Arquivos**:
- `src/components/cms/AdvancedJsonEditor.tsx`: seções 3-6 do painel Docs reescritas; `handleCopyPrompt` atualizado

**Razão**: Documentação anterior não cobria padrões críticos (rich-text array, array aninhado, escalar na raiz, objeto fixo). IA gerava UI Schema incorreto para esses casos.

**Impacto**: Painel Docs agora tem seção "5 Padrões Essenciais" com exemplos de dado + UI Schema para cada padrão. Prompt copiável cobre todos os 5 padrões, heurística de widget por nome de campo, e lista de campos hidden. Qualquer IA que receba o prompt consegue gerar UI Schema correto para qualquer JSON de dados.

---

### [2026-05-22] — Feat: Propriedades visuais no UI Schema (ui:color, ui:size, ui:placeholder)

**Arquivos**:
- `src/components/cms/DynamicFieldRenderer.tsx`:
  - `UiConfig` ampliado com `ui:color`, `ui:size`, `ui:placeholder`
  - `accentColor` / `accentStyle` / `accentClass` derivados do `uiConfig` e aplicados em todos os renderers de leaf (text, textarea, url, number)
  - `textareaHeightClass` mapeado de `ui:size` → classes `min-h-[*]`
  - `placeholder` sobrescreve o auto-gerado nos inputs de texto, textarea e url
  - Object collapsible: borda esquerda colorida no container + título colorido no header quando `ui:color` definido
- `src/components/cms/AdvancedJsonEditor.tsx`:
  - Seção 2 do painel Docs reescrita: tabela de `ui:widget` + 3 novas seções (ui:color, ui:size, ui:placeholder) com exemplos visuais e grid de tamanhos
  - Prompt IA (exibido e copiado) atualizado com `PROPRIEDADES VISUAIS` e exemplo incluindo `ui:color`, `ui:size`, `ui:placeholder`
- `.claude/context/cms/mode-advanced.md`: tabela de propriedades ampliada com as 3 novas

**Razão**: Desenvolvedor não tinha como diferenciar visualmente campos críticos, controlar altura de textareas longas nem customizar os placeholders sem editar código

**Impacto**:
- `ui:color: "#00D26A"` → borda esquerda verde em qualquer campo, vermelho em campos de atenção, etc.
- `ui:size: "xl"` → textarea de 280px para campos de corpo de texto
- `ui:placeholder: "Ex: ..."` → instrução contextual no campo sem precisar de `ui:description`

---

### [2026-05-22] — Fix: Documentação interna do painel "Como personalizar a tela do cliente" corrigida

**Arquivos**:
- `src/components/cms/AdvancedJsonEditor.tsx`: seções 3, 4 e 5 do painel Docs reescritas
  - Seção 3 ("regra do asterisco") → renomeada para "prefixo content. e asterisco *"; exemplos corrigidos de `hero.title` / `cards.*.image` para `content.hero.title` / `content.hero.slides.*.headline`
  - Seção 4 ("Exemplo na prática") → reescrito com `content.equipe.*` mostrando seção raiz + array aninhado; resultado lista "seção aparece no menu lateral" (não apenas "bloco ganhou título")
  - Seção 5 (prompt IA) → reescrito completamente: instrui gerar chaves com `content.` prefix, inclui todos os `ui:widget` incluindo `url`, exemplo correto de FAQ embutido; prompt `handleCopyPrompt` sincronizado

**Razão**: Os exemplos anteriores usavam `"card"` e `"cards.*.image"` (sem `content.` prefix) — o desenvolvedor colava esses exemplos e o painel de seções ficava vazio porque `resolveUiConfig` não encontrava as chaves

**Impacto**:
- ✅ Desenvolvedor que seguir a documentação interna agora gera UI Schema no formato correto de primeira
- ✅ Prompt da IA gera chaves com `content.` prefix obrigatório + exemplo embutido no prompt para ancoragem

---

### [2026-05-22] — Docs: mode-advanced.md reescrito + formato canônico de UI Schema documentado

**Arquivos**:
- `.claude/context/cms/mode-advanced.md`: reescrito por completo — novo layout 3 colunas, UI Schema formato flat canônico, normalização nested→flat, `getDeep`, `effectiveUiSchema`, tabela de `ui:widget`, exemplo completo, diferenças Builder vs Edit
- `.claude/context/cms/_index.md`: seção UI Schema atualizada com formato correto (`content.` prefix obrigatório) e nota sobre formato nested

**Razão**: Documentação anterior não refletia o sistema de seções derivado do UI Schema, o prefixo `content.` obrigatório nas chaves, nem a normalização de formato nested → flat

**Impacto**: Qualquer Claude futuro que precise gerar ou depurar UI Schema saberá imediatamente o formato correto e como o `resolveUiConfig` resolve os caminhos

---

### [2026-05-22] — Fix: Renderização correta de seções no Builder Avançado (UI Schema nested + DFR inline)

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`:
  - Adicionado `getDeep()` para navegar `localData` por array de path (ex: `["content","faq"]`)
  - Adicionado `isNestedUiSchema()`, `processNode()`, `normalizeNestedUiSchema()` para converter formato nested → flat com prefixo `content.`
  - Adicionado `effectiveUiSchema` via `useMemo` — normaliza se necessário, nunca muta o estado do Monaco
  - Substituído todo uso de `uiSchemaState` no render (sections filter, `getSectionLabel`, DFR `uiSchema` prop) por `effectiveUiSchema`
  - DFR agora recebe `path={selectedSection.split('.')}` e `value={getDeep(localData, selectedSection.split('.'))}` — correto para seções em `content.*`
  - Prop `inline` passada ao DFR (pula wrapper collapsible na raiz da seção)
- `src/components/cms/DynamicFieldRenderer.tsx`:
  - Adicionado prop `inline?: boolean` — quando `true`, renderiza filhos direto sem accordion wrapper
  - Extraído `renderEntries()` para reutilização entre inline e collapsible

**Razão**: 
- `uiSchemaState` com formato nested gerava seções com chave sem `content.` prefix → `localData["faq"]` retornava `undefined`; com formato flat gerava chaves `"content.faq"` mas o filtro `!key.includes('.')` excluía todas → painel de seções vazio
- DFR envolvia a seção inteira num accordion com título `"content.faq-mavellium"` desnecessário

**Impacto**:
- ✅ Formato flat (`"content.faq": {...}`) → seções aparecem corretamente, dados carregados via `getDeep`
- ✅ Formato nested (`{ "faq": { "ui:label": "..." } }`) → normalizado automaticamente para flat com `content.` prefix
- ✅ Seção selecionada renderiza campos sem wrapper collapsible extra
- ✅ Labels de `ui:label` aparecen corretamente em todos os campos via `resolveUiConfig`

---

### [2026-05-21] — Feat: UI Padrão Automática Quando Sem UI Schema

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: `sections` agora faz fallback para `Object.keys(localData)` quando `uiSchemaState` está vazio

**Razão**: Quando o desenvolvedor tinha dados no JSON mas sem UI Schema configurado, a terceira coluna ficava vazia — nenhuma seção aparecia no menu

**Impacto**:
- ✅ Sem UI Schema → seções derivadas das chaves de `localData`
- ✅ Campos renderizados com inferência automática de tipo (`inferType`): image, textarea, color, boolean, url, icon, etc
- ✅ Com UI Schema → comportamento anterior preservado (seções do UI Schema têm prioridade)

---

### [2026-05-21] — Feat: IconPicker — Seletor Visual de Ícones Lucide

**Arquivos**:
- `src/components/cms/IconPicker.tsx`: **NOVO** — Dialog com busca + grid de 3897 ícones lucide-react; filtra por nome em tempo real; MAX_VISIBLE=300; exibe ícone atual com nome; botão X limpa seleção
- `src/components/cms/DynamicFieldRenderer.tsx`: `type === 'icon'` agora usa `<IconPicker />` em vez de input de texto

**Razão**: Campo de texto livre não dava feedback visual — usuário não sabia quais ícones existem

**Impacto**:
- ✅ Campo icon em qualquer formulário CMS agora é seletor visual
- ✅ Busca filtra em tempo real por nome
- ✅ Valor salvo como string (ex: `"ArrowRight"`) — compatível com dados existentes, sem breaking change

---

### [2026-05-21] — UX/DX Builder: 3 Colunas Modo Avançado + Preview Tempo Real + Unsaved Changes

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: Estado `uiSchemaState` (rastreia UI Schema em tempo real); remover modal de preview; banner "Alterações não salvas" no topo-centro; aviso do navegador ao sair sem salvar; `sections = Object.keys(uiSchemaState).filter(key => !key.includes('.'))` para renderizar seções dinamicamente; integrar `localData` com AdvancedJsonEditor para preview em tempo real
- `src/components/cms/AdvancedJsonEditor.tsx`: remover icon `Code2` (não usado); adicionar `useEffect` para sincronizar `uiSchemaLocal` quando `initialUiSchema` prop muda; adicionar seção "5. Prompt para gerar UI Schema com IA" na documentação; adicionar botão "Copiar" para copiar prompt; remover `formPanel` quando `showFormPanel={false}` para expandir editor Monaco

**Razão**: 
- Modo avançado precisa de visualização REAL dos dados conforme edita (não esperando salvar)
- UI Schema edição deve atualizar seções instantaneamente
- Usuário vê aviso quando há mudanças não salvas
- Documentação interna com prompt copy-paste para gerar UI Schema automaticamente

**Impacto**:
- **Preview em Tempo Real**: Ao editar aba DADOS → dados aparecem no Editor Campo; ao editar aba INTERFACE → seções aparecem no Menu SEÇÕES
- **Unsaved Changes Banner**: Topo-centro mostra "Alterações não salvas" com pulsação enquanto há mudanças
- **Aviso Navegador**: Se tentar reload/close com mudanças, navegador avisa
- **Sem Modal**: Clica em Salvar e salva direto (sem preview modal antes)
- **AdvancedJsonEditor Sync**: Mudanças no UI Schema sincronizam instantaneamente com SchemaBuilderEditor
- **Documentação IA**: Seção "Prompt para gerar UI Schema com IA" com botão copiar para qualquer IA criar UI Schema automaticamente

---

### [2026-05-21] — UX Developer: AdvancedJsonEditor + 3 colunas no Builder Avançado

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: quando `isAdvancedMode=true`, renderiza `AdvancedJsonEditor` (com tabs internos Dados | Interface) no center; modo não-advanced mantém Monaco editor; 3 colunas lado direito quando advanced (menu seções 350px | editor campo 350px); botão 📖 Doc no header (integrado com AdvancedJsonEditor)

**Razão**: Developer edita dados e UI schema na mesma tela com tabs internos, vendo simultaneamente preview de seções e como cada campo ficaria

**Impacto**:
- Modo normal: Monaco editor (JSON bruto) - PRESERVADO
- Modo avançado: AdvancedJsonEditor com tabs Dados/Interface + 3 colunas (seções + editor)
- AdvancedJsonEditor já tem tabs e documentação internos
- Botão 📖 Doc integrado no header

---

### [2026-05-21] — UX Developer: 3 colunas no Builder Avançado (Editor JSON | Menu Seções | Editor Campo)

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: quando `isAdvancedMode=true`, renderiza 3 colunas no lado direito: left (1fr) = Monaco editor (JSON bruto, sempre), middle (350px) = menu seções com `Object.keys(localData)`, right (350px) = `DynamicFieldRenderer` contextual ao clicar seção; `setDeep()` + `handleFieldChange()` para edição imutável; `MediaUploadModal` integrado; botão Salvar persiste via `updatePageAdvancedData()` e recarrega estado

**Razão**: Developer edita JSON no Monaco (mesma coluna de sempre) e vê em tempo real como cada seção/campo renderizaria ao ser editado (2 colunas novas ao lado)

**Impacto**:
- Modo não-avançado: left (menu + abas) | center (Monaco) | right (preview legado) — PRESERVADO
- Modo avançado: left (menu + abas, oculto) | center (Monaco) | right (menu seções 350px + editor campo 350px)
- SEM iframe (diferente do edit mode)
- Upload de mídia funciona normalmente
- Mesma estrutura que edit mode (3 colunas) mas sem iframe

---

### [2026-05-20] — Verificação Completa: ZERO Sobreescritas — Isolamento Garantido em Todos os Cenários

**Arquivos Verificados**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: Builder → `updatePageSchema()` (schemaData)
- `src/components/schema-builder/SiteContentEditClient.tsx`: Edit Legado → `updatePageContentData()` (contentData); Edit Avançado → `updatePageSchema()` (schemaData)
- `src/components/schema-builder/DynamicForm.tsx`: Legado → carrega contentData + schemaData, salva contentData APENAS
- `src/modules/projects/actions/updatePageSchema.ts`: salva schemaData APENAS
- `src/modules/projects/actions/updatePageContentData.ts`: salva contentData APENAS
- `src/modules/projects/actions/updatePageAdvancedData.ts`: salva schemaData + uiSchema (Builder Advanced)
- `src/modules/projects/actions/updatePageMode.ts`: muda isAdvanced APENAS

**Razão**: Validar que não há cenário onde um modo sobrescreva o outro; garantia arquitetural total

**Impacto**:
- ✅ Builder salva em schemaData, nunca em contentData
- ✅ Edit Legado salva em contentData, nunca em schemaData
- ✅ Edit Avançado salva em schemaData, ignora contentData
- ✅ Modo Avançado no Builder salva schemaData + uiSchema (sem tocar contentData)
- ✅ Alternância de modos via updatePageMode (flag APENAS)
- ✅ Invariante: contentData (legado) ⊥ schemaData (avançado) — campos isolados, nunca compartilham
- ✅ Criar documento: `.claude/context/cms/data-isolation-verification.md` com tabela completa de cenários

---

### [2026-05-20] — Segurança: Isolamento total entre modos (cada um no seu quadrado)

**Arquivos**:
- `src/components/schema-builder/SiteContentEditClient.tsx`: corrigido — modo avançado carrega de `schemaData` (dados JSON) e salva em `schemaData`; modo legado carrega de `contentData` (valores) e salva em `contentData`

**Razão**: Garantir que cada modo tenha seu próprio espaço de dados, sem jamais sobrescrever o outro

**Impacto**:
- Modo legado: lê `schemaData` (schema) + `contentData` (valores) → salva em `contentData` APENAS
- Modo avançado: lê `schemaData` (dados JSON), ignora `contentData` → salva em `schemaData` APENAS
- Sem compartilhamento de campos entre modos
- Usuário alterna modos sem perder dados ou causar sobrescita
- Cada campo "na sua caixa": legado em `contentData`, avançado em `schemaData`

---

### [2026-05-20] — Edit page avançado: layout 3 colunas (Menu de Seções → Iframe → Editor Contextual)

**Arquivos**:
- `src/components/schema-builder/SiteContentEditClient.tsx`: reescrito — modo avançado usa `grid grid-cols-[250px_1fr_350px]`; coluna 1 é menu de seções com `getSectionLabel` via uiSchema; coluna 2 é iframe; coluna 3 é `DynamicFieldRenderer` contextual com empty state (`MousePointerClick`) e botão Salvar no rodapé; `AdvancedJsonEditor` removido do fluxo de edição; `setDeep` + `localData` state substituem `schemaDataRef`; upload de mídia integrado via `MediaUploadModal` + `uploadMedia`; modo legado preservado sem alterações

**Razão**: UX de edição para usuário final em modo avançado: ao invés de editar JSON bruto no Monaco, usuário navega seções e edita campos visuais

**Impacto**:
- Modo avançado: 3 colunas; seções derivadas de `Object.keys(schemaData)`; labels via `uiSchema[key]?.['ui:label']`
- Coluna 3 vazia enquanto nenhuma seção selecionada (empty state)
- Campo alterado → `setDeep` imutável + debounced postMessage ao iframe
- Salvar persiste via `updatePageSchema` (mesmo endpoint de antes)
- Modo legado: layout 2 colunas preservado sem mudanças

---

### [2026-05-20] — UI Schema: documentação amigável reescrita no painel flutuante

**Arquivos**:
- `src/components/cms/AdvancedJsonEditor.tsx`: conteúdo do painel Docs reescrito em linguagem não-técnica; 4 seções estruturadas: (1) explicação motor vs maquiagem, (2) propriedades com nome/apelido/exemplo, (3) tabela de ui:widget com descrições amigáveis, (4) regra do asterisco, (5) exemplo prático com checklist do resultado

**Razão**: Documentação anterior era técnica e voltada para devs; usuário pediu linguagem acessível para quem não programa

**Impacto**:
- Nenhuma mudança de lógica — apenas conteúdo do painel de docs
- Layout mantido: painel flutuante `w-80 absolute right-0` sem overlay

---

### [2026-05-20] — UI Schema: painel de docs flutuante (sem overlay) no Builder

**Arquivos**:
- `src/components/cms/AdvancedJsonEditor.tsx`: Accordion removido; painel de documentação refeito como `absolute right-0 top-0 h-full w-80` dentro do container do modo dev (sem overlay); botão "Docs" aparece apenas na aba Interface; painel tem seções: Propriedades, Valores de ui:widget, Sintaxe de caminho, Exemplo

**Razão**: Accordion inline reduzia a altura do Monaco; usuário pediu painel flutuante no canto direito sem overlay/backdrop

**Impacto**:
- Monaco ocupa 100% da altura disponível (Accordion não compete mais)
- Painel flutua sobre o form panel direito sem escurecer nada
- Botão "Docs" ativo/inativo com estado visual; fecha com X
- Disponível somente quando aba Interface está ativa

---

### [2026-05-20] — UI Schema: wildcard preciso + Accordion de documentação no Builder

**Arquivos**:
- `src/components/cms/DynamicFieldRenderer.tsx`: `resolveUiConfig` reescrita com 3 prioridades explícitas — (1) caminho exato `dotPath`, (2) wildcard via `dotPath.replace(/\.\d+\./g, '.*.')`, (3) array-raiz via `'*.' + path.slice(1).join('.')`
- `src/components/cms/AdvancedJsonEditor.tsx`: Sheet removido; Accordion "📖 Como usar o UI Schema" adicionado acima do Monaco quando aba Interface está ativa; documentação em formato de tabela (propriedades + sintaxe de caminho)

**Razão**: Wildcard anterior usava array.map que não mapeava corretamente caminhos raiz (ex: `0.name` → `*.name`); documentação em Sheet era menos visível que Accordion inline

**Impacto**:
- `card.0.name` → resolve `card.*.name` ✓; `0.name` → resolve `*.name` ✓
- Accordion aparece somente na aba "Interface" — não polui a aba "Dados"
- Tabela explica todas as props e sintaxe de wildcard diretamente no editor

---

### [2026-05-20] — UI Schema: padrão de separação entre dados e interface (Modo Avançado)

**Arquivos**:
- `prisma/schema.prisma`: novo campo `uiSchema Json? @default("{}") @map("ui_schema")` no model Page
- `src/modules/projects/actions/updatePageAdvancedData.ts`: nova action criada — salva `schemaData` + `uiSchema` atomicamente
- `src/components/cms/DynamicFieldRenderer.tsx`: adicionado prop `uiSchema`, função `resolveUiConfig` (dot notation + wildcard), suporte a `ui:label`, `ui:description`, `ui:widget` (incluindo `hidden`), `ui:group`
- `src/components/cms/AdvancedJsonEditor.tsx`: adicionado prop `initialUiSchema` e `onUiSchemaChange`; layout em modo dev agora tem abas "Dados" / "Interface" no Monaco; Sheet "📖 Ajuda" com documentação embutida
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: adicionado `initialUiSchema` prop, `uiSchemaRef`; `handleSaveContent` agora chama `updatePageAdvancedData`
- `src/app/.../sites/.../builder/page.tsx`: query inclui `uiSchema`, passa `initialUiSchema`
- `src/app/.../landing-pages/.../builder/page.tsx`: idem
- `src/app/.../sites/.../edit/page.tsx`: query inclui `uiSchema`, passa `initialUiSchema`
- `src/app/.../landing-pages/.../edit/page.tsx`: idem
- `src/components/schema-builder/SiteContentEditClient.tsx`: aceita e repassa `initialUiSchema` para `AdvancedJsonEditor`

**Razão**: Dev precisava de controle sobre labels e tipos de input no painel sem poluir o payload JSON entregue pela API ao site

**Impacto**:
- Builder (modo avançado): duas abas no Monaco — "Dados" (schemaData) e "Interface" (uiSchema); botão "📖 Ajuda" com documentação inline; save chama `updatePageAdvancedData`
- Edit page (modo avançado): renderiza form com labels/tipos sobrescritos pelo uiSchema (read-only para o uiSchema)
- API pública (`contentData`): nunca contém chaves de UI — separação garantida em nível de DB
- Resolução de caminho usa dot notation com suporte a wildcard (`cards.*.nome`) e sem índice (`cards.nome`)

---

### [2026-05-19] — Edit page modo avançado salva schema (não conteúdo)

**Arquivos**:
- `src/components/schema-builder/SiteContentEditClient.tsx`: adicionar schemaDataRef, atualizar handleSave e AdvancedJsonEditor para usar/salvar schema (linhas 1-7, 36, 43-51, 118-121)

**Razão**: Em modo avançado, edit page deve atualizar o SCHEMA (não content legado) tanto para dev quanto cliente

**Impacto**: 
- Modo avançado (isAdvanced=true): AdvancedJsonEditor edita schemaData com updatePageSchema
- Modo normal (isAdvanced=false): DynamicForm edita contentData com updatePageContentData
- Dados não são mais perdidos
- API retorna schema correto em modo avançado

---

### [2026-05-19] — Corrigir contentDataObj para aceitar arrays

**Arquivos**:
- `src/components/schema-builder/SiteContentEditClient.tsx`: remover verificação `!Array.isArray()` do contentDataObj (linha 36-41)

**Razão**: initialContentData pode ser array em modo avançado; quando era array, contentDataObj tornava-se `{}`, perdendo dados ao salvar

**Impacto**: 
- contentDataObj agora preserva arrays do initialContentData
- AdvancedJsonEditor em edit page funciona corretamente com dados originais
- Dados salvos refletem o estado atual, não valores vazios
- API retorna conteúdo atualizado corretamente

---

### [2026-05-19] — Debounce responsivo em página de edit

**Arquivos**:
- `src/components/schema-builder/SiteContentEditClient.tsx`: reduzir debounce de 400ms para 150ms (linha 55)

**Razão**: Debounce muito grande (400ms) causa atraso perceptível ao editar campos, dando impressão de dados antigos

**Impacto**: 
- Atualização do preview mais responsiva (150ms)
- Usuário vê mudanças de forma mais imediata
- Menos chance de confundir com valores antigos
- Still debounced para evitar muitos updates simultâneos

---

### [2026-05-19] — Modo avançado salva schema (não conteúdo)

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: adicionar advancedSchemaRef, atualizar handleSaveContent para salvar schema em modo avançado (linhas 256, 302-322, 549-553)

**Razão**: Em modo avançado, handleSaveContent estava salvando contentData; deveria salvar o schema avançado modificado

**Impacto**: 
- Modo avançado agora salva o schema com updatePageSchema
- Modo normal continua salvando conteúdo com updatePageContentData
- AdvancedJsonEditor atualiza advancedSchemaRef ao invés de contentDataRef
- Usuário consegue editar e salvar JSON livre em modo avançado corretamente

---

### [2026-05-19] — Endpoint retorna apenas schema OU content (não ambos)

**Arquivos**:
- `src/app/api/v1/content/[companySlug]/[pageSlug]/route.ts`: adicionar isAdvanced ao select e condicionar retorno (linhas 40-68)

**Razão**: Endpoint estava retornando sempre schema + content misturados; deveria retornar apenas um dependendo de isAdvanced

**Impacto**: 
- Se `isAdvanced = true`: retorna apenas `schema`
- Se `isAdvanced = false`: retorna apenas `content`
- API mais limpa e sem dados desnecessários
- Cliente recebe JSON correto conforme o modo ativo

---

### [2026-05-19] — Modo avançado exibe schema correto (não legacy)

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: mudar data prop do AdvancedJsonEditor para initialSchema (linha 539)

**Razão**: Em modo avançado (JSON Livre), AdvancedJsonEditor estava exibindo contentData (legado) ao invés do schema atual

**Impacto**: 
- Modo avançado agora mostra o JSON do schema (estrutura)
- AdvancedJsonEditor recebe initialSchema ao invés de contentDataObj
- Usuário vê dados corretos em modo avançado

---

### [2026-05-19] — Permitir scroll de conteúdo no builder (editor + preview)

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: mudar `overflow-hidden` para `overflow-y-auto` (linhas 433, 435, 514, 597)

**Razão**: Em desktop, conteúdo do editor (Monaco) e preview (formulário) estavam sendo cortados sem possibilidade de scroll

**Impacto**: 
- Container principal: permite scroll vertical em desktop
- Editor: permite scroll do JSON/formulário
- Painéis laterais (estrutura, preview): permite scroll de seus conteúdos
- Usuário consegue ver todo o conteúdo sem zoom

---

### [2026-05-19] — Compactação do header no builder

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: reduzir padding, gap e tamanho de botões do header (linhas 355, 378, 405, 414, 423)

**Razão**: Header com muitos elementos causa quebra em múltiplas linhas em desktop, ocupando altura excessiva e forçando zoom

**Impacto**: 
- Header mais compacto: gap-1 e py-1.5 ao invés de gap-2 e py-2
- Botões reduzidos: text-xs ao invés de text-sm, px-3 ao invés de px-4
- Menos quebra de linha em resoluções padrão
- Mais espaço para editor em desktop

---

### [2026-05-19] — Botões Reload e Construtor agrupados no edit

**Arquivos**:
- `src/components/schema-builder/SiteContentEditClient.tsx`: agrupar buttons em container flex com gap-1 (linhas 93-111)

**Razão**: Botões devem ficar próximos e alinhados um do outro no header de edição

**Impacto**: 
- Reload e Construtor ficam lado a lado com pequeno espaçamento (gap-1)
- Melhor visual e layout mais compacto no header de edit

---

### [2026-05-19] — Botão "Visualizar" no builder abre na mesma aba

**Arquivos**:
- `src/components/schema-builder/SchemaBuilderEditor.tsx`: remover target="_blank" (linha 425-426)

**Razão**: Fluxo de navegação entre builder → edit deve ser na mesma aba, não abrir novas abas

**Impacto**: 
- Clique em "Visualizar" no builder navega para `/edit` na mesma aba
- Volta ao builder com botão "Construtor" funcional

---

### [2026-05-19] — Botão "Construtor" em páginas de edição com permissão PAGE_BUILD

**Arquivos**:
- `src/app/.../sites/[siteId]/pages/[pageId]/edit/page.tsx`: adicionar checkPermission + builderHref
- `src/app/.../landing-pages/[lpId]/pages/[pageId]/edit/page.tsx`: adicionar checkPermission + builderHref
- `src/components/schema-builder/SiteContentEditClient.tsx`: adicionar props builderHref + botão Construtor

**Razão**: Quando usuário tem permissão PAGE_BUILD, deve poder voltar ao construtor direto da página de edição

**Impacto**: 
- Botão "Construtor" (com ícone Hammer) aparece no header de edição se user tem PAGE_BUILD
- Clique redireciona para `/pages/[pageId]/builder`
- Não aparece se user não tem permissão (false não mostra botão)

---

### [2026-05-19] — Consolidação da arquitetura CMS em Knowledge Base

**Arquivos**:
- `.claude/` nova pasta com 14 arquivos de documentação
- `CLAUDE.md`: Adicionada regra de manutenção obrigatória (linha 42+)
- `janus_cms_architecture.md`: Removido (substituído por estrutura modular)

**Razão**: Maximizar eficiência de tokens (arquivos pequenos 1-5KB) e criar mecanismo automático de documentação.

**Impacto**: 
- Futuras edições CMS requerem consultar `.claude/context/cms/rules.md` primeiro
- Changelog cresce em 2-3 linhas por mudança (não monolítico)
- Menos tokens carregados por sessão (ler apenas o necessário)
- Auto-enforcement de regras via diretiva em `CLAUDE.md`

---

### [2026-05-19] — CMS docs centralizado em `.claude/context/cms/`

**Arquivos**:
- `.claude/context/cms/`: pasta criada, todos os arquivos CMS movidos para cá
- `.claude/README.md`: atualizar referências de `cms/` para `context/cms/`
- `CLAUDE.md`: atualizar referências de `.claude/cms/` para `.claude/context/cms/`

**Razão**: Organizar documentação sob namespace de contexto para clareza estrutural

**Impacto**: 
- Todas as referências documentadas foram atualizadas
- Novo caminho: `.claude/context/cms/` é o ponto central CMS

---

### [2026-05-19] — Endpoint público + responsividade em modo avançado (edit)

**Arquivos**:
- `src/app/.../sites/[siteId]/pages/[pageId]/edit/page.tsx`: adicionar slug + apiEndpoint
- `src/app/.../landing-pages/[lpId]/pages/[pageId]/edit/page.tsx`: adicionar slug + apiEndpoint
- `SiteContentEditClient.tsx`: aceitar + passar apiEndpoint para AdvancedJsonEditor
- `AdvancedJsonEditor.tsx`: renderizar info bar com endpoint + botão copiar; melhorar responsividade mobile

**Razão**: Modo avançado deve mostrar qual é o endpoint público para acessar JSON; tela de edit responsiva em mobile

**Impacto**: 
- Usuários veem endpoint da API pública ao editar em modo avançado
- Podem copiar endpoint com um clique
- Formulário responsivo em mobile (menos padding, labels smaller, grid single col)

---

### [2026-05-19] — Endpoint no builder (avançado) + remover de edit

**Arquivos**:
- `SchemaBuilderEditor.tsx`: adicionar info bar com endpoint em modo avançado (isAdvancedMode=true)
- `AdvancedJsonEditor.tsx`: remover apiEndpoint prop
- `SiteContentEditClient.tsx`: remover apiEndpoint prop
- Edit pages (sites/landing-pages): remover apiEndpoint, simplificar queries

**Razão**: Endpoint deve aparecer no builder (como no legado), não na página de edit. Editar é apenas conteúdo.

**Impacto**: 
- Builder modo avançado mostra endpoint no topo
- Página de edit não mostra endpoint
- Responsividade melhorada em mobile (grid ajustado)

---

### [2026-05-19] — Hard refresh (Ctrl+Shift+R) no botão reload de edit

**Arquivos**:
- `SiteContentEditClient.tsx`: adicionar cache-busting query param `?v={reloadKey}` ao iframe URL

**Razão**: Botão reload deve fazer hard refresh sem cache (equivalente a Ctrl+Shift+R)

**Impacto**: 
- Clique em Reload força recarregamento completo do iframe
- URL muda com `?v={reloadKey}`, força bypass de cache do browser
- Preview sempre mostra versão mais recente

---

### [2026-05-19] — Preferência por pnpm + obrigatoriedade de registry skill

**Arquivos**:
- `CLAUDE.md`: mudar npm para pnpm em comandos, adicionar regra de registry obrigatória
- `.claude/README.md`: atualizar comando de teste para pnpm
- `.claude/quick-ref/checklist.md`: atualizar npm para pnpm

**Razão**: pnpm é mais eficiente; registry skill deve ser sempre executada para manter PROJECT.md atualizado

**Impacto**: 
- Todos os comandos agora usam pnpm
- Registry skill é obrigatória ao final de cada tarefa que altere código
- PROJECT.md fica sempre sincronizado com codebase

---

