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

