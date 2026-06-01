# PROJECT.md — Registro do Janus (Multi-Tenant)

> **Leia este arquivo no início de cada sessão.**
> **Atualize-o sempre que criar, mover ou deletar qualquer arquivo.**
> Objetivo: Claude sabe o que existe sem precisar ler todos os arquivos.

---

## Arquitetura Multi-Tenant + Dev Panel

Janus é um sistema de gerenciamento de projetos Multi-Tenant focado em empresas. Cada usuário pertence a uma `Company` e acessa suas páginas/projetos através de rotas namespaceadas por `[companySlug]`.

### Separação de Rotas

| Tipo | Prefixo | Acesso |
|------|---------|--------|
| Tenant (empresa) | `/[companySlug]/dashboard/...` | role `DEFAULT` |
| Developer | `/dev/[devId]/dashboard/...` | role `DEVELOPER` |
| Admin (God Mode) | `/dashboard-admin/...` | role `ADMIN` |

### Lógica de Redirecionamento no Login

1. `signInAction` usa `redirect: false`, obtém a sessão após autenticação e redireciona manualmente.
2. `DEVELOPER` → `redirect('/dev/${user.id}/dashboard')`
3. `ADMIN` → `redirect('/dashboard-admin')`
4. `DEFAULT` → `redirect('/${companySlug}/dashboard')`
5. Middleware (`auth.config.ts` authorized callback) reforça a separação:
   - ADMIN acessando qualquer outra rota que não `/dashboard-admin` → autorizado
   - Não-ADMIN acessando rota `/dashboard-admin` → redireciona para `/login`
   - DEVELOPER acessando rota de tenant → redireciona para `/dev/[id]/dashboard`
   - Não-DEVELOPER acessando rota `/dev/...` → redireciona para `/[slug]/dashboard`
   - DEVELOPER com devId errado na URL → redireciona para o ID correto

---

## Módulos

### companies
- **Entidade:** `Company` (Prisma) — id (UUID), slug (unique), name, description, logo, soft-delete
- **Relações:** Um para Muitos com `User` e `Project`

### users
- **Entidade:** `src/modules/users/domain/User.ts` — usuário com role DEFAULT/ADMIN, normaliza email, valida hash; `companyId` agora nullable (usuário pode não ter empresa)
- **Erros:** `src/modules/users/domain/errors.ts` — INVALID_EMAIL, INVALID_PASSWORD, EMAIL_ALREADY_EXISTS, INVALID_CREDENTIALS
- **Actions:** `registerUser.ts` — cria usuário com bcrypt hash e `companyId` = default company | `signInAction.ts` — redireciona para `/select-company` (multi-empresa), `/no-company` (sem empresa), ou direto para `/dashboard` (empresa única) | `updatePreferences.ts` — persiste preferências de UI no banco | `updateAvatar.ts` — atualiza avatar com URL da BunnyCDN
- **Queries:** `getUserByEmail.ts` — busca usuário ativo por email (sem deletedAt) | `getUserPreferences.ts` — busca preferências do usuário logado | `getUserCompanies.ts` — lista empresas vinculadas via `UserCompany`

### projects
- **Entidade:** `Project` (Prisma) — id (UUID), companyId (fk), name, type (LANDING_PAGE | INSTITUTIONAL), isActive (bool, default true), deletedBy (string?), deletionReason (string?), deletedAt — soft delete com auditoria
- **Relações:** Um para Muitos com `Page`; belongsTo `Company`

### pages
- **Entidade:** `Page` (Prisma) — id (UUID), projectId (fk), name, slug (unique por project), **NEW:** schemaData (Json, form structure), **NEW:** contentData (Json, form values), **NEW:** uiSchema (Json, UI configuration), **NEW:** isAdvanced (bool, edit mode flag), soft-delete
- **Relações:** belongsTo `Project`
- **Data Isolation:** 
  - Legacy mode (isAdvanced=false): contentData é editável via DynamicForm; schemaData é READ-ONLY (estrutura do dev)
  - Advanced mode (isAdvanced=true): schemaData é editável (dados JSON livre); contentData é IGNORADO
  - Mode switching via updatePageMode APENAS altera flag, nunca toca dados

### projectHistories
- **Entidade:** `ProjectHistory` (Prisma) — id (UUID), projectId (fk), userId (fk), previousState (Json), newState (Json), version (Int), createdAt
- **Uso:** Auditoria de alterações em projetos; rastreia quem alterou o quê

### projects
- **Actions:** 
  - `softDeleteProject.ts` — inativa projeto (isActive: false), registra deletedBy, deletionReason, deletedAt; revalida rotas de sites e landing-pages
  - `updateProject.ts` — atualiza nome e previewUrl do projeto; autoriza por companySlug; revalida listagens
  - `createPage.ts` — cria página com nome/slug (sanitizado); valida slug único por projeto; inicializa schemaData={} e contentData={}
  - `updatePage.ts` — atualiza nome e slug da página; autoriza por companySlug; sanitiza slug; revalida listagem
  - `updatePageSchema.ts` — persiste JSON schema em `Page.schemaData`; valida JSON, autoriza, revalida
  - `updatePageContentData.ts` — persiste valores preenchidos em `Page.contentData` (legacy mode); valida, autoriza, revalida; NUNCA toca schemaData
  - `updatePageMode.ts` — **NOVO:** alterna flag `isAdvanced`; ONLY muda flag, não toca dados (schemaData, contentData, uiSchema)
  - `updatePageAdvancedData.ts` — **NOVO:** modo builder avançado salva `schemaData` + `uiSchema` em uma operação; valida, autoriza, revalida; NUNCA toca contentData
  - `togglePagePublish.ts` — toggle `isPublished`; valida acesso por companySlug; revalida listagem
- **Queries:** 
  - `getProjects.ts` — busca projetos ativos (isActive: true, deletedAt: null) com filtro opcional por tipo; retorna com contagem de páginas
  - `getPagesByProjectId.ts` — busca páginas de um projeto específico; ordena por criação decrescente

### Components (CMS Builder)

#### SchemaBuilderEditor
- **Localização:** `src/components/schema-builder/SchemaBuilderEditor.tsx`
- **Props:** pageId, pageName, backHref, initialSchema, initialUiSchema, initialIsAdvanced, apiUrl, initialPublished, previewHref
- **Estados:** `isAdvancedMode`, `uiSchemaState` (raw do Monaco), `localData` (schemaData), `selectedSection`, `hasUnsavedChanges`
- **`effectiveUiSchema`:** `useMemo` que normaliza nested→flat via `isNestedUiSchema` + `normalizeNestedUiSchema`; nunca persiste; chaves espelham paths reais sem prefixo obrigatório
- **Normalização:** `normalizeNestedUiSchema` converte `{ "secao": { "ui:label": "..." } }` para `{ "secao": { "ui:label": "..." } }` (sem `content.` prefix)
- **Layout Avançado (3 colunas):** Centro: AdvancedJsonEditor tabs DADOS/INTERFACE | Direita 1 (350px): Menu SEÇÕES via `effectiveUiSchema` | Direita 2 (350px): DynamicFieldRenderer com `inline` prop
- **Unsaved Changes:** Banner + aviso navegador ao sair sem salvar
- **Upload Mídia:** MediaUploadModal integrado

#### AdvancedJsonEditor
- **Localização:** `src/components/cms/AdvancedJsonEditor.tsx`
- **Props:** pageId, data, initialUiSchema, isDevMode, showFormPanel, onDataChange, onUiSchemaChange
- **Quando showFormPanel={false}:** Monaco ocupa 100%; tabs DADOS | INTERFACE apenas; usado no builder
- **Quando showFormPanel={true}:** Monaco (40%) + FormPanel (60%); FormPanel renderiza campos via uiSchemaLocal
- **Sincronização:** useEffect monitora initialUiSchema prop; sincroniza uiSchemaLocal em TEMPO REAL
- **Painel Docs (botão "Docs" na aba INTERFACE):** 6 seções — propriedades, widgets, regra das chaves, 5 padrões essenciais, exemplo completo, prompt IA copiável
- **Tabs Internos:** DADOS (editor JSON dos dados) | INTERFACE (editor JSON do UI Schema)

#### DynamicFieldRenderer
- **Localização:** `src/components/cms/DynamicFieldRenderer.tsx`
- **Renderiza:** Campos por tipo inferido ou `ui:widget` (text, textarea, image, video, boolean, color, number, url, icon, **hidden**)
- **Entrada:** value, path, dataKey, uiSchema, `inline` (bool — pula wrapper collapsible no objeto raiz)
- **Propriedades UiConfig:** `ui:label`, `ui:widget`, `ui:description`, `ui:color` (borda hex), `ui:size` (sm/md/lg/xl textarea), `ui:placeholder`
- **`resolveUiConfig`:** exact path → wildcard (`\.\d+\.` → `.*. `) → array-root; lê `effectiveUiSchema` plano
- **Callbacks:** onChange (atualiza dados), onOpenMediaModal (abre upload dialog)
- **Icon widget:** delega para `IconPicker` (galeria Lucide)

#### IconPicker
- **Localização:** `src/components/cms/IconPicker.tsx`
- **Renderiza:** Seletor visual de ícones lucide-react com busca em tempo real
- **Comportamento:** Botão mostra ícone atual + nome; abre Dialog com grid; busca filtra por nome; MAX_VISIBLE=300 ícones por vez; X limpa seleção
- **Integração:** Usado automaticamente quando `type === 'icon'` no DynamicFieldRenderer

### dev
- **Queries:**
  - `getCompanies.ts` — lista todas empresas ativas com contagem de users/projects
  - `getRecentCompanies.ts` — últimas N empresas criadas (padrão 5)
  - `getRecentUsers.ts` — últimos N usuários DEFAULT (padrão 5), inclui company
  - `getUsers.ts` — todos os usuários ativos com company e role
  - `getDevStats.ts` — contagens paralelas: totalCompanies, totalUsers, totalProjects (filtrado por createdById)
  - `getRecentProjects.ts` — últimos N projetos atualizados (padrão 5), inclui nome da empresa
- **Actions:**
  - `createCompany.ts` — cria empresa; valida slug único; revalida dev dashboard
  - `editCompany.ts` — edita nome/slug/descrição de empresa; valida conflito de slug
  - `deleteCompany.ts` — soft delete de empresa (set deletedAt)
  - `createUser.ts` — cria usuário com role DEFAULT vinculado a empresa; hash bcrypt

---

## CMS: Regras Absolutas (Data Isolation + UI Schema)

**IMPORTANTE:** Leia `.claude/context/cms/` antes de mexer no builder/editor.

### Data Isolation Guarantee
- **Legacy Mode (isAdvanced=false):** Edita `contentData` via DynamicForm; `schemaData` permanece intacto
- **Advanced Mode (isAdvanced=true):** Edita `schemaData` JSON livre; `contentData` é IGNORADO completamente
- **Mode Switch:** `updatePageMode()` APENAS altera flag, NUNCA toca dados
- **No Overwrites:** Alternar modos 1000x = dados sempre intactos (verificado em data-isolation-verification.md)

### UI Schema Pattern (aba INTERFACE)
- **Propósito:** Define labels, tipos de widgets, visuais (UX) sem alterar dados
- **Regra fundamental:** chave = caminho exato no JSON de dados; SEM prefixo obrigatório
- **Estrutura:**
  ```json
  {
    "parceiros": { "ui:label": "🤝 Parceiros", "ui:color": "#f59e0b" },
    "parceiros.*.nome": { "ui:label": "Nome" },
    "parceiros.*.img": { "ui:label": "Foto", "ui:widget": "image" },
    "parceiros.*.depoimento.*.type": { "ui:widget": "hidden" },
    "parceiros.*.depoimento.*.value": { "ui:label": "Depoimento", "ui:widget": "textarea" }
  }
  ```
- **Wildcards:** `*` substitui índices numéricos; wildcard duplo `*.*.` para arrays aninhados
- **Propriedades visuais:** `ui:color` (borda hex), `ui:size` (sm/md/lg/xl textarea), `ui:placeholder`, `ui:description`
- **5 Padrões:** Rich-text Array, Array de Objetos, Array Aninhado, Objeto Fixo, Escalar na Raiz — documentados no painel Docs do builder
- **Prompt IA:** Botão "Copiar" na seção "6. Prompt para gerar com IA" do painel Docs gera UI Schema correto para qualquer JSON

### Builder Advanced Mode (3 Colunas)
1. **Editor JSON (Centro):** AdvancedJsonEditor com tabs DADOS | INTERFACE
2. **Menu SEÇÕES (Direita 1):** Mostra seções do UI Schema em tempo real
3. **Editor CAMPO (Direita 2):** DynamicFieldRenderer para editar campos individuais
4. **Preview:** Conforme edita, mudanças aparecem instantaneamente (sem salvar)
5. **Unsaved Changes:** Banner + aviso navegador se tentar sair sem salvar

### Componentes Críticos
- `SchemaBuilderEditor.tsx` — orquestra todo o builder (legacy + advanced)
- `AdvancedJsonEditor.tsx` — editor JSON com tabs e sincronização em tempo real
- `DynamicFieldRenderer.tsx` — renderiza campos baseado em tipo + UI Schema
- `SiteContentEditClient.tsx` — edit page (legacy + advanced, com iframe para preview)

### admin
- **Queries:**
  - `getLoginLogs.ts` — lista tentativas falhas de login (limit param)
  - `getLoginLogsByIp.ts` — filtra por IP
  - `getAdminStats.ts` — contagens globais: usersCount, developersCount, companiesCount, blockedCount
  - `getAdminCompanies.ts` — todas as empresas ativas com contagem de users/projects
  - `getAdminUsers.ts` — usuários com role DEFAULT/ADMIN, inclui company
  - `getAdminDevelopers.ts` — usuários com role DEVELOPER, inclui company (slug)
  - `getBlockedIps.ts` — IPs com 3+ tentativas na última hora, agrupados com contagem e emails
- **Actions:**
  - `unblockIp.ts` — remove bloqueio de um IP (admin-only)
  - `adminCreateCompany.ts` — cria empresa; verifica role ADMIN
  - `adminEditCompany.ts` — edita empresa; verifica role ADMIN; valida conflito de slug
  - `adminDeleteCompany.ts` — **hard delete** em cascata de empresa; verifica role ADMIN; apaga tudo via DB cascade
  - `adminDeleteUser.ts` — **hard delete** de usuário ou desenvolvedor; verifica role ADMIN; cascade automático via DB
  - `adminCreateUser.ts` — cria usuário com role DEFAULT; verifica role ADMIN; hash bcrypt
  - `createDeveloper.ts` — cria usuário com role DEVELOPER; verifica role ADMIN; hash bcrypt

### scripts
- **Actions:** `createScript.ts` — cria SiteScript vinculado ao projectId | `updateScript.ts` — atualiza nome/code/position | `deleteScript.ts` — hard delete | `toggleScript.ts` — toggle isActive
- **Queries:** `getScriptsByProjectId.ts` — lista scripts de um projeto (todos, sem filtro isActive); exporta `SiteScriptRow`

### upload
- **Actions:** `uploadImage.ts` — converte imagens para .avif via sharp (quality: 80), suporta subpastas dinâmicas (folder: 'avatars'), upload para BunnyCDN
- **Actions:** `uploadMedia.ts` — suporta image (→ AVIF) e video (direto raw); valida tamanho (5MB img / 200MB vídeo); envia para BunnyCDN; retorna URL pública

### auth
- **Actions:** `startImpersonation.ts` — valida ADMIN/DEVELOPER, **guarda impersonação de ADMIN/DEVELOPER (retorna erro se target.role !== DEFAULT)**, seta 3 cookies HTTP-Only (`user_id`, `user_name`, `return_url`), aceita `returnTo` opcional | `stopImpersonation.ts` — deleta cookies; se `redirectTo=false` não redireciona (modo privilegiado); senão redireciona para `returnUrl` do cookie ou URL explícita | `checkIpStatus.ts` — rate limit por IP no login (3 tentativas/1h)
- **Queries:** `getCompanyUsers.ts` — usuários ativos de uma empresa (id, name, email, role), ordenados por name

---

## Componentes

- `src/components/auth/LoginForm.tsx` — Client — formulário de login com useActionState + checkIpStatus, countdown regressivo (MM:SS), overlay bloqueio com cor #514030
- `src/components/dev/DevSidebar.tsx` — Client — sidebar colapsável exclusiva do Dev Dashboard; links para dashboard, empresas, usuários e configurações do dev
- `src/components/admin/AdminSidebar.tsx` — Client — sidebar colapsável exclusiva do Admin Panel; links para `/dashboard-admin/*` (dashboard, empresas, desenvolvedores, usuários, logs, configurações)
- `src/components/dashboard/ImpersonationSelector.tsx` — Client — modal de busca e seleção de usuário para impersonar; filtro por nome/email/role; dispara `startImpersonation(userId, slug, window.location.href)` e navega para dashboard
- `src/components/dashboard/ImpersonationBanner.tsx` — Client — banner vermelho `bg-destructive` com nome do usuário impersonado; botões: KeyRound (editar permissões do alvo), Shield (ver como Admin/Dev — `stopImpersonation(false)` + `window.location.href`), Trocar (abre selector), Voltar ao Painel (`stopImpersonation(returnUrl)` via `window.location.href`); barra sutil `bg-muted` com "Simular Usuário" quando não impersonando — também mostra "Voltar ao Painel" no modo privilegiado (não impersonando)
- `src/components/dashboard/UserPermissionsModal.tsx` — Client — modal de permissões RBAC por módulo (sites/landingPages) e tier (project/page); toggle Switch salva imediatamente via `updateUserPermissions`; aberto pelo KeyRound no banner
- `src/components/dashboard/Sidebar.tsx` — Client — sidebar colapsável com useState(initialCollapsed) + startTransition; logo 48px→28px; toggle PanelLeftClose/PanelLeftOpen; avatar next/image + fallback UserCircle; estado persistido via updatePreferences em background
- `src/components/schema-builder/SchemaBuilderEditor.tsx` — Client — workspace 3 painéis: Esquerda (w-72) com Tabs Estrutura/Componentes — Estrutura lista seções com ícone `Layers`, `Trash2` hover-only para excluir via Monaco ref e click para `scrollIntoView` no preview com ring highlight 1s; Componentes tem 8 cards de snippets com ícone/descrição; Centro: Monaco full-width endpoint; IDs únicos por sufixo random ao inserir snippet; Direita: LiveFormPreview reativo
- `src/components/schema-builder/LiveFormPreview.tsx` — Client — preview read-only; aceita `focusedSectionId?: string | null`; cada seção tem `id="section-{key}"` para `scrollIntoView`; highlight `ring-2 ring-brand-primary/20` quando focada; suporta tipos: text, textarea, image, number, color, boolean, select, url, html, list, video
- `src/components/schema-builder/IframePreview.tsx` — Client — iframe de preview com toggle Desktop/Tablet/Mobile; fallback elegante quando sem previewUrl; mobile simula iPhone (375px), tablet simula iPad (768px)
- `src/components/schema-builder/DynamicForm.tsx` — Client — formulário dinâmico com upload CDN BunnyCDN para `image` (→ AVIF) e `video` (direto); `uploadingFields: Set<string>` e `uploadErrors` por campo; botão Salvar desabilitado durante upload; suporta todos os tipos: text, textarea, image, number, color, boolean, select, url, html, list, video; tipo `list` dinâmico com adicionar/remover/itens e sub-campos (`itemFields`); chave de seção via `section.id ?? section.name ?? section.section`
- `src/components/schema-builder/SiteContentEditClient.tsx` — Client — editor de conteúdo 3 colunas (modo avançado); coluna 1: menu de seções com labels via uiSchema; coluna 2: iframe preview (real-time updates); coluna 3: editor contextual com `DynamicFieldRenderer` + upload de mídia; modo legado 2 colunas preservado; `setDeep` imutável + `MediaUploadModal`
- `src/components/projects/CreatePageModal.tsx` — Client — modal de criação de página com nome e slug (auto-gerado); valida slug único por projeto
- `src/components/projects/PublishPageButton.tsx` — Client — toggle Publicar/Despublicar com ícones Globe/GlobeOff; server action `togglePagePublish`
- `src/components/projects/EditPageContainer.tsx` — Client — container que gerencia estado e key incremental do `EditPageModal` (força re-mount com dados frescos)
- `src/components/projects/EditPageModal.tsx` — Client — modal de edição de página (nome/slug); usa `useActionState` + `useEffect` para fechar; aviso sobre slug alterar URL da API
- `src/components/projects/EditProjectContainer.tsx` — Client — container com key incremental para `EditProjectModal` (força re-mount com previewUrl atualizado)
- `src/components/projects/EditProjectModal.tsx` — Client — modal de configurações do projeto (nome + previewUrl); salva via `updateProject`
- `src/components/scripts/ScriptsClient.tsx` — Client — CRUD completo de SiteScripts: tabela com Switch isActive, modal criar/editar (textarea para code, select posição), confirm de exclusão
- `src/components/cms/JanusScriptManager.tsx` — Server — fetcha `/api/sites/[siteId]/scripts` (revalidate 60s) e injeta scripts via `next/script`; detecta src vs inline; strategy `afterInteractive`/`lazyOnload` por posição
- `src/components/ui/toast-container.tsx` — Client — toast notifications (success/error) com tokens semânticos
- `src/components/ui/alert-dialog.tsx` — Client — AlertDialog primitivos (Radix) com overlay, header, footer, action, cancel
- `src/components/ui/delete-alert-modal.tsx` — Client — modal reutilizável de confirmação de exclusão; props: isOpen, onClose, onConfirm, title, description, isDeleting
- `src/components/ui/SlugInput.tsx` — Client — input de slug com validação em tempo real (só a-z, 0-9, hífen); sanitiza automaticamente; feedback visual de erro; suporta controlado e não-controlado
- `src/components/ui/AdminDataTable.tsx` — Client — tabela genérica `AdminDataTable<T>` reutilizável; props: columns, filters, getRowId, searchPredicate, onBulkDelete, renderRowActions, headerRight; features: busca, filtros com chips, visibilidade/D&D de colunas, multi-select, bulk delete modal (autoFocus Cancel), paginação (10/25/50)
- `src/components/_archived_builder/*` — **ARQUIVADO** — Low-code builder antigo (não importado em nenhuma rota; excluído do tsconfig)
- `src/components/users/update-avatar-modal.tsx` — Client — modal com Dialog/Tabs para upload de avatar via arquivo ou URL com preview
- `src/components/ThemeProvider.tsx` — Client — provedor de tema para dashboard com preferências do usuário
- `src/components/GlobalThemeProvider.tsx` — Client — provedor global de tema com sincronização periódica + troca de favicon (favicon.png claro / favicon-white.png escuro)
- `src/components/ThemeScript.tsx` — Client — aplica classe dark no HTML e observa mudanças para atualizar favicon dinamicamente

---

## Páginas

- `src/app/page.tsx` — root redireciona para `/dev/[id]/dashboard` (DEVELOPER) ou `/{companySlug}/dashboard` (outros roles)
- `src/app/dev/[devId]/dashboard/layout.tsx` — layout protegido do Dev; valida role=DEVELOPER e devId === session.user.id; suporte a DevSidebar colapsável via CSS var
- `src/app/dev/[devId]/dashboard/page.tsx` — Centro de Comando: 4 top cards (totalCompanies, totalUsers, totalProjects, atividade recente) + grid 3 colunas (últimos projetos, últimas empresas, últimos usuários)
- `src/app/dev/[devId]/dashboard/companies/page.tsx` — Server Component; busca getCompanies(); passa para CompaniesClient
- `src/app/dev/[devId]/dashboard/companies/CompaniesClient.tsx` — Client — CRUD de empresas: criar, editar, soft-delete via Dialog/useActionState
- `src/app/dev/[devId]/dashboard/users/page.tsx` — Server Component; busca getUsers() e getCompanies(); passa para UsersClient
- `src/app/dev/[devId]/dashboard/users/UsersClient.tsx` — Client — tabela de usuários + modal de criação com Select de empresa
- `src/app/dev/[devId]/dashboard/settings/page.tsx` — Server Component; busca user do DB; passa para DevSettingsClient
- `src/app/dev/[devId]/dashboard/settings/DevSettingsClient.tsx` — Client — perfil + segurança + preferências (sem aba Empresa)
- `src/app/dashboard-admin/layout.tsx` — layout protegido do Admin; valida role=ADMIN; AdminSidebar + ThemeProvider
- `src/app/dashboard-admin/page.tsx` — dashboard global: 4 cards de métricas + listas de últimas empresas/usuários
- `src/app/dashboard-admin/companies/page.tsx` + `AdminCompaniesClient.tsx` — CRUD completo de empresas (criar/editar/soft-delete)
- `src/app/dashboard-admin/users/page.tsx` + `AdminUsersClient.tsx` — tabela de usuários DEFAULT/ADMIN + modal criar/editar com `CompanyMultiSelect` (busca + criação rápida + badge principal) + `PasswordField`
- `src/app/dashboard-admin/developers/page.tsx` + `AdminDevelopersClient.tsx` — tabela de DEVELOPERs + modal de criação com role DEVELOPER
- `src/app/dashboard-admin/logs/page.tsx` + `AdminLogsClient.tsx` — Tabs: IPs Bloqueados (com botão Desbloquear) + Tentativas Recentes
- `src/app/dashboard-admin/settings/page.tsx` — configurações do admin; reutiliza DevSettingsClient
- `src/app/(auth)/login/page.tsx` — tela de login (Server Component)
- `src/app/(auth)/no-company/page.tsx` — Client — bloqueio elegante para usuário sem empresa; botão "Voltar" chama `signOut({ callbackUrl: '/login' })`
- `src/app/(auth)/select-company/page.tsx` — Server — seleção de empresa para usuários multi-empresa; redireciona direto se 0 ou 1 empresa
- `src/app/(auth)/select-company/SelectCompanyClient.tsx` — Client — grid de empresas com loading state por card; badge "Principal"; botão Sair
- `src/app/[companySlug]/dashboard/layout.tsx` — layout protegido; valida se usuário pode acessar a empresa; busca image e preferences do DB; passa initialCollapsed, email e image como props para Sidebar
- `src/app/[companySlug]/dashboard/page.tsx` — dashboard principal com dados reais de projetos; busca institutional e landing page projects; exibe estatísticas; links dinâmicos para /sites e /landing-pages
- `src/app/[companySlug]/dashboard/sites/page.tsx` — listagem de sites (INSTITUTIONAL); grid de cards com projeto, data, contagem de páginas; botão Gerenciar aponta para /sites/[siteId]/pages
- `src/app/[companySlug]/dashboard/landing-pages/page.tsx` — listagem de landing pages; mesma estrutura com variações visuais

**Layouts Aninhados (Contexto de Projeto):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/layout.tsx` — layout aninhado; renderiza ContextSidebar; valida acesso ao projeto; herda pelo dashboard
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/layout.tsx` — layout aninhado para landing pages; mesma estrutura de validação

**Páginas de Contexto (Sites):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` — listagem de páginas; botões: Publicar, Configurações, Construir, Editar; modal CreatePageModal funcional
- `src/app/[companySlug]/dashboard/sites/[siteId]/scripts/page.tsx` — Server Component; valida acesso; busca scripts via `getScriptsByProjectId`; renderiza `ScriptsClient`
- `src/app/api/sites/[siteId]/scripts/route.ts` — GET público; retorna scripts ativos do projeto; `revalidate=60`; header `Cache-Control`
- `src/app/[companySlug]/dashboard/sites/[siteId]/analytics/page.tsx` — tela de resultados (placeholder)
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/page.tsx` — tela de blog (placeholder)

**Páginas de Contexto (Landing Pages):**
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/page.tsx` — listagem de páginas; mesma estrutura de botões e modal
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/analytics/page.tsx` — tela de resultados
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/page.tsx` — tela de blog

**Construir (Schema Editor — Headless):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/builder/page.tsx` — Server Component; busca `schemaData` e `slug`; calcula URL da API pública; renderiza `<SchemaBuilderEditor />`
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/builder/page.tsx` — mesmo padrão para landing pages

**Editar Conteúdo (Split-Pane):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/edit/page.tsx` — Split-Pane: esquerda `DynamicForm` (w-1/3), direita `IframePreview` (w-2/3); passa `previewUrl` do projeto
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/edit/page.tsx` — mesmo padrão para landing pages

---

## Schema Prisma

- **Company** (`companies`) — id (UUID), slug (unique, indexed), name (string), description (String?), logo (String?), **createdById (UUID?, id do criador)**, createdAt, updatedAt, deletedAt | relações: User, Project, GuestEntry com **onDelete: Cascade**
- **User** (`users`) — id (UUID), email (unique), password (text), role (**DEFAULT/ADMIN/DEVELOPER**), image (String?), preferences (Json? default {}), **companyId (UUID?, nullable fk→companies SET NULL)**, **createdById (UUID?, id do criador)**, requiresPasswordReset (bool), permissions (String[]), createdAt, updatedAt, deletedAt
- **UserCompany** (`user_companies`) — id (UUID), userId (fk→users CASCADE), companyId (fk→companies CASCADE), permissions (String[]), createdAt | @@unique([userId, companyId])
- **LoginAttempt** (`login_attempts`) — id (UUID), ip (string, indexed), email (string optional), createdAt
- **Project** (`projects`) — id (UUID), companyId (UUID, fk→companies **CASCADE**), name (string), type (LANDING_PAGE|INSTITUTIONAL), **previewUrl (String?, nullable)**, isActive (bool), deletedBy, deletionReason, deletedAt, createdAt, updatedAt
- **Page** (`pages`) — id (UUID), projectId (UUID, fk→projects **CASCADE**), name, slug (unique per project), content (Json, legacy), **schemaData (Json, default {}, headless schema)**, **contentData (Json, default {}, valores preenchidos)**, isPublished (bool, default false), createdAt, updatedAt, deletedAt
- **SiteScript** (`site_scripts`) — id (UUID), name, code (Text), position (HEAD|BODY_END enum), isActive (bool default true), projectId (UUID, fk→projects CASCADE), createdAt, updatedAt
- **ProjectHistory** (`project_histories`) — id (UUID), projectId (UUID, fk→projects **CASCADE**), userId (UUID, fk→users **CASCADE**), previousState (Json?), newState (Json?), version (Int), createdAt

---

## Lib / Utilitários

- `src/lib/prisma.ts` — singleton do PrismaClient com `accelerateUrl` (Prisma 7, export `db`)
- `src/lib/auth.config.ts` — NextAuthConfig base: authorized callback protege `/first-access`, `/no-company`, `/select-company` (login obrigatório); rota raiz e `/login` redirecionam para `/no-company` quando `slug` é nulo; middleware reforça separação de roles
- `src/lib/auth.ts` — NextAuth v5: CredentialsProvider + PrismaAdapter + JWT strategy
- `src/lib/utils.ts` — `cn`, `formatCurrency` (BRL), `formatDate` (pt-BR)

---

## Configuração de Testes

- `vitest.config.ts` — jsdom, globals, alias `@/*`, setupFiles
- `src/test/setup.ts` — importa `@testing-library/jest-dom/vitest`
- `src/modules/users/domain/User.spec.ts` — 6 testes: create, reconstitute, toObject
- `src/test/create-test-user.spec.ts` — 5 fases de teste para criar usuário teste2@gmail.com
- `src/lib/auth.spec.ts` — teste de error handling para LoginAttempt
- `scripts/seed-test-user.ts` — **Atualizado:** cria empresa test-company, usuário teste2@gmail.com, projeto Test Project, página Home com conteúdo JSON
- `scripts/test-db-connection.ts` — script para testar conectividade com PostgreSQL
- `SETUP_TEST_USER.md` — **Reescrito:** guia completo de setup Multi-Tenant, credenciais, fluxo de auth, troubleshooting

**Ambiente de Teste:**
- **Empresa:** `test-company` (slug) / "Test Company" (nome)
- **Usuário:** `teste2@gmail.com` / `123456` (email/senha)
- **Projeto:** "Test Project" (LANDING_PAGE)
- **Página:** "Home" (slug: home, conteúdo JSON com hero section)
- **URL Acesso:** `http://localhost:3000/test-company/dashboard`

---

## Infraestrutura e Auth (Multi-Tenant)

- `src/lib/auth.config.ts` — **FIX (2026-05-09):** authorized callback refatorado; extrai companySlug da sessão; redireciona root (/) para `/{companySlug}/dashboard`; redireciona /login para `/{companySlug}/dashboard`; valida companySlug ao acessar rota protegida
- `src/lib/auth.ts` — NextAuth v5; authorize busca user.company; retorna companySlug no objeto do usuário
- `src/modules/users/actions/signInAction.ts` — **FIX (2026-05-09):** Removido redirectTo hardcoded; usa redirect: true para middleware processar redirecionamento dinâmico
- `src/middleware.ts` — NextAuth(authConfig).auth (padrão oficial); matcher: `/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)`
- `src/app/api/auth/[...nextauth]/route.ts` — Route Handler do Auth.js (GET, POST)
- `src/types/next-auth.d.ts` — Augmentação de tipos: companySlug em Session/JWT/User
- `.env.example` — template de variáveis: DATABASE_URL e AUTH_SECRET
- `docs/postman/auth_collection.json` — coleção Auth.js: Sign In, Get Session, CSRF, Sign Out

---

## Design System

- `src/app/globals.css` — variáveis brand: primary, **cta** (#E35336), cta-hover, text, btn-dark, btn-light, hover, muted, bg (light + dark)
- `tailwind.config.ts` — cores brand mapeadas incluindo `brand.cta` e `brand.cta-hover`
- `src/components/ui/button.tsx` — variant `default` usa `bg-brand-cta text-white hover:bg-brand-cta-hover`
- `.claude/skills/ui-design.md` — documentada regra CTA: usar `bg-brand-cta` / `<Button>` default

---

## Módulo Blog

### blog
- **Actions:** `createBlogCategory.ts`, `updateBlogCategory.ts`, `deleteBlogCategory.ts` — CRUD categorias
- **Actions:** `createBlogTag.ts`, `updateBlogTag.ts`, `deleteBlogTag.ts` — CRUD tags
- **Actions:** `createBlogPost.ts`, `updateBlogPost.ts`, `deleteBlogPost.ts` — CRUD artigos; status DRAFT/PUBLISHED com publishedAt auto; authorId FK; categories M:N
- **Actions:** `toggleBlogEnabled.ts` — ativa/desativa blog por projeto
- **Queries:** `getBlogCategories.ts`, `getBlogTags.ts`, `getBlogPosts.ts`, `getBlogPost.ts`, `getCompanyUsers.ts` — lista usuários da empresa para select de autor

## Componentes Blog

- `src/components/blog/RichEditor.tsx` — Client — editor Tiptap com toolbar, upload de imagem inline (BunnyCDN)
- `src/components/blog/BlogTabNav.tsx` — Client — navegação por abas (Publicações/Categorias/Tags) com active state via usePathname
- `src/components/blog/BlogManagementHeader.tsx` — Server — header "Gerenciar Blog" com ícone + BlogTabNav; recebe basePath
- `src/components/blog/CategoriesClient.tsx` — Client — layout 3 colunas: Categorias (raiz) | Subcategorias | Painel de edição; isActive toggle; imagem ANTES do nome; trash icon com modal de confirmação (sem delete no form)
- `src/components/blog/TagsClient.tsx` — Client — layout 3 colunas: Tags (raiz) | Sub-tags | Painel de edição; isActive toggle; imagem ANTES do nome; trash icon com modal de confirmação (sem delete no form)
- `src/components/blog/PostsListClient.tsx` — Client — exporta `BlogPostsTable` e `PostsListClient`; filtros rápidos (Status/Autor/Categoria), D&D na ordenação de colunas, bulk delete via modal (autoFocus no Cancelar), lápis icon para editar
- `src/components/blog/PostEditorClient.tsx` — Client — layout 2 colunas: corpo à esquerda; sidebar direita com status toggle (Rascunho/Publicado), select de autor com avatar, cascade multi-select de categorias, tags, SEO

## Páginas Blog (Sites)

- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/page.tsx` — lista artigos
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/new/page.tsx` — novo artigo
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/[postId]/edit/page.tsx` — editar artigo
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/categories/page.tsx` — categorias
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/tags/page.tsx` — tags

## Páginas Blog (Landing Pages)

- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/page.tsx` — lista artigos
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/new/page.tsx` — novo artigo
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/[postId]/edit/page.tsx` — editar artigo
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/categories/page.tsx` — categorias
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/tags/page.tsx` — tags

## Schema Prisma (Blog)

- **BlogCategory** (`blog_categories`) — name, description, imageUrl, slug, seoTitle, seoDescription, seoKeywords, **isActive (bool, default true)**, projectId, parentId (self-referencial → SubCategories) | CASCADE do Project
- **BlogTag** (`blog_tags`) — name, description, imageUrl, slug, seoTitle, seoDescription, seoKeywords, **isActive (bool, default true)**, projectId, parentId (self-referencial → SubTags) | CASCADE do Project
- **BlogPostStatus** (enum) — DRAFT | PUBLISHED (default PUBLISHED para backward compat)
- **BlogPost** (`blog_posts`) — title, subtitle, body, **status (BlogPostStatus)**, **publishedAt (DateTime?)**, coverImageUrl, authorName, **authorId (UUID?, FK→User SetNull)**, SEO fields, projectId | CASCADE do Project
- **BlogPostCategory** (`blog_post_categories`) — join M:N BlogPost ↔ BlogCategory; PK composta [postId, categoryId] | CASCADE ambos
- **BlogPostTag** (`blog_post_tags`) — join M:N BlogPost ↔ BlogTag | CASCADE ambos os lados
- **Project** — campo `blogEnabled Boolean @default(false)` adicionado

---

## Últimas alterações

| Data       | Arquivo                                       | O que foi feito                                            |
| :--------- | :-------------------------------------------- | :--------------------------------------------------------- |
| 2026-05-31 | `Dockerfile`, `.dockerignore`, `package.json` | BUILD: Docker migrado de npm para pnpm — corepack + `pnpm@10.33.3` pinado; `pnpm install --frozen-lockfile` (usa pnpm-lock.yaml, antes ignorado); `pnpm exec prisma generate` + `pnpm run build`; novo `.dockerignore` evita host node_modules sobrescrever o do estágio deps |
| 2026-05-31 | `src/scripts/backup.ts`, `src/scripts/backup-daemon.ts`, `src/scripts/restore.ts`, `BACKUP_AUDIT.md` | PERF: backup em streaming `pg_dump → gzip(level 1)` (remove buffer 512MB/RAM→swap); `nice -n 19`/`ionice -c3` no pg_dump (docker); saída `.sql.gz`; restore retrocompatível; logs de duração/tamanho; `BACKUP_ON_BOOT` opcional |
| 2026-05-31 | `src/app/api/[companySlug]/[projectId]/blog/route.ts`, `package.json` | FIX: resolvido merge conflict (imports rate-limit + slug); instalado `@tiptap/extension-text-style`; build volta a passar |
| 2026-05-24 | `prisma/schema.prisma`, `prisma/migrations/20260524*` | FEAT: `companyId` em User agora nullable (String?); FK `ON DELETE SET NULL`; tabela `UserCompany` para vínculo many-to-many user↔company |
| 2026-05-24 | `src/modules/admin/actions/adminCreateUser.ts` | REFACTOR: Aceita `linkedCompanyIds[]` via FormData; cria vínculos `UserCompany` em transação; `companyId` primary = primeiro da lista |
| 2026-05-24 | `src/modules/admin/actions/adminEditUser.ts` | FEAT: Atualiza empresas vinculadas via deleteMany+createMany em transação; sincroniza `companyId` primário |
| 2026-05-24 | `src/modules/admin/actions/adminQuickCreateCompany.ts` | NOVO: Cria empresa com apenas nome; auto-gera slug via `toSlug()`; sufixo timestamp em colisão |
| 2026-05-24 | `src/modules/admin/actions/linkUserCompany.ts` | FIX: `unlinkUserCompany` migrado de `delete` para `deleteMany` (safe quando linha ausente); zera `companyId` se desvinculando empresa primária |
| 2026-05-24 | `src/modules/auth/queries/getCompanyUsers.ts` | FIX: Query busca via `OR [companyId, companies.some]`; exclui role ADMIN da lista (não podem ser simulados) |
| 2026-05-24 | `src/modules/auth/actions/enterPrivilegedMode.ts` | NOVO: Limpa cookies de impersonation; seta `IMPERSONATION_RETURN_URL_COOKIE`; usado ao clicar em empresa no admin |
| 2026-05-24 | `src/modules/users/actions/signInAction.ts` | FEAT: Multi-empresa → `/select-company`; empresa única → `/dashboard`; sem empresa → `/no-company` |
| 2026-05-24 | `src/components/ui/password-field.tsx` | NOVO: Input senha com olho toggle + botão "Gerar" senha segura (12 chars, upper/lower/digit/symbol) |
| 2026-05-24 | `src/app/dashboard-admin/users/AdminUsersClient.tsx` | FEAT: `CompanyMultiSelect` em criar e editar; `PasswordField` em ambos os modais; removido ícone Building2 da tabela |
| 2026-05-24 | `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx` | FEAT: ADMIN clica empresa → `enterPrivilegedMode` + navega (nunca impersona usuário direto) |
| 2026-05-24 | `src/app/[companySlug]/dashboard/layout.tsx` | FEAT: Passa `companyUsers` (via `getCompanyUsers`) e `allCompanies` ao `ImpersonationBanner` |
| 2026-05-24 | `src/components/dashboard/ImpersonationBanner.tsx` | REESCRITO: Modo privilegiado mostra `UserPicker` (dropdown com busca, usuários da empresa); modo simulando mantém banner vermelho com Trocar/Shield/Voltar |
| 2026-05-24 | `src/lib/auth.config.ts` | FEAT: Protege `/no-company` e `/select-company`; redireciona `slug` nulo para `/no-company` |
| 2026-05-24 | `src/app/(auth)/no-company/page.tsx` | NOVO: Client Component com `signOut` no botão voltar (evita loop de redirect); UI com ícone composto + bloco instrução |
| 2026-05-24 | `src/app/(auth)/select-company/page.tsx` | NOVO: Server Component; redireciona direto se 0/1 empresa; passa lista para `SelectCompanyClient` |
| 2026-05-24 | `src/app/(auth)/select-company/SelectCompanyClient.tsx` | NOVO: Grid de empresas com loading por card; badge "Principal"; botão Sair via `signOut` |
| 2026-05-24 | `src/app/dashboard-admin/PermissionsModal.tsx`, `AdminUsersClient.tsx`, `AdminDevelopersClient.tsx` | UX: Adicionado `onBack` ao PermissionsModal — botão ArrowLeft volta para o `PermissionsModuleSelector` para trocar de Sites/Landing Pages sem fechar tudo |
| 2026-05-24 | `src/components/dashboard/UserPermissionsModal.tsx` | UX: Modal reescrito como wizard de 2 fases — Fase 1 escolhe módulo (Sites/Landing Pages), Fase 2 configura permissões; botão ArrowLeft no topo volta para Fase 1 |
| 2026-05-24 | `src/components/dev/DevSidebar.tsx`, `src/components/dashboard/Sidebar.tsx`, `src/components/guest/GuestSidebar.tsx` | FIX: Logo padronizada para `115px × 50px` container + `90×90` image (replicado do AdminSidebar) |
| 2026-05-23 | `src/lib/cms/sync-script-template.js` | NOVO: IIFE Vanilla JS; guard iframe; injeção de style; click→postMessage; message→CMS_SELECT_SECTION |
| 2026-05-23 | `src/app/api/projects/[projectId]/generate-script/route.ts` | NOVO: API POST; lê template, upload BunnyCDN, salva `cmsSyncScriptUrl` no projeto |
| 2026-05-23 | `prisma/schema.prisma` | ADD: campo `cmsSyncScriptUrl` em `Project` |
| 2026-05-23 | `src/components/schema-builder/SchemaBuilderEditor.tsx` | FEAT: painel "Integração Front-end" — tag script pronta, botão Copiar, botão Regerar, card instruções |
| 2026-05-23 | `src/app/.../builder/page.tsx` | UPDATE: query `cmsSyncScriptUrl`, passa `projectId` e `initialCmsSyncScriptUrl` ao editor |
| 2026-05-23 | `src/components/schema-builder/SiteContentEditClient.tsx` | FIX: Modo advanced reescrito — `effectiveUiSchema`+`uiSchemaSections` para seções corretas, `getDeep` para valor do DFR, `inline` prop, save via `updatePageSchemaContent` (sem restrição de role) |
| 2026-05-23 | `src/modules/projects/actions/updatePageSchemaContent.ts` | NOVO: Action que salva `schemaData` sem restrição de role; usada pelo edit avançado para usuários DEFAULT |
| 2026-05-22 | `src/components/cms/AdvancedJsonEditor.tsx` | DOCS: Padrão 6 adicionado — JSON com chave de agrupamento (`content`, `data`, `sections`); aviso ⚠️ na seção 3, card red-border na seção 4 (agora "6 Padrões"), dois exemplos na seção 5 (flat vs wrapper), prompt atualizado com PADRÃO CRÍTICO |
| 2026-05-22 | `src/components/cms/AdvancedJsonEditor.tsx` | DOCS: Painel Docs reescrito — seção "5 Padrões Essenciais" (rich-text array, array aninhado, objeto fixo, escalar), exemplo completo, prompt IA copiável abrangente |
| 2026-05-22 | `src/components/schema-builder/SchemaBuilderEditor.tsx` | FIX: `normalizeNestedUiSchema` removeu prefixo `content.` forçado; chaves agora espelham paths reais; `effectiveUiSchema` via useMemo |
| 2026-05-22 | `src/components/cms/DynamicFieldRenderer.tsx` | FEAT: Propriedades visuais `ui:color` (borda hex), `ui:size` (altura textarea sm/md/lg/xl), `ui:placeholder`; prop `inline` pula wrapper collapsible |
| 2026-05-22 | `src/modules/auth/actions/startImpersonation.ts` | FEAT: Guard contra impersonar ADMIN ou DEVELOPER (retorna erro se target.role !== DEFAULT) |
| 2026-05-22 | `src/app/dashboard-admin/users/AdminUsersClient.tsx` | FIX: Botão olho (impersonar) só aparece para usuários com role DEFAULT; removido tipo `PermissionTier` não utilizado |
| 2026-05-22 | `src/components/dashboard/ImpersonationBanner.tsx` | FIX: "Voltar ao Painel" usa `window.location.href` (não redirect server-side); botão também exibido no modo privilegiado sem impersonação |
| 2026-05-22 | `src/app/[companySlug]/dashboard/layout.tsx` | FEAT: Calcula `adminReturnPath` e passa como prop ao ImpersonationBanner |
| 2026-05-22 | `.claude/context/cms/mode-advanced.md` | DOCS: Reescrito — "Não existe prefixo obrigatório"; regra das chaves, padrões, propriedades visuais, exemplo canônico |
| 2026-05-22 | `.claude/context/cms/changelog.md` | DOCS: 5 entries adicionadas com todas as mudanças da sessão |
| 2026-05-21 | `src/components/cms/IconPicker.tsx` | NOVO: Seletor visual de ícones lucide-react com busca e grid; integrado ao DynamicFieldRenderer substituindo input de texto |
| 2026-05-21 | `src/components/cms/DynamicFieldRenderer.tsx` | FIX: Campo icon agora usa IconPicker (Dialog com grid de ícones) em vez de input de texto livre |
| 2026-05-21 | `src/components/cms/AdvancedJsonEditor.tsx` | FIX: handleFieldChange atualiza rawJson em tempo real; useEffect sincroniza Monaco quando prop data muda externamente |
| 2026-05-21 | `.claude/context/auth/` | DOCS: Documentação completa do módulo de permissões e impersonation (_index, domain, actions, queries, patterns, changelog) |
| 2026-05-20 | `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx`, `getAdminCompanies.ts` | FEAT: Botão "Acessar Painel" no admin agora abre modal de seleção de usuário da empresa para impersonar; query expandida com name/email dos users |
| 2026-05-20 | `src/lib/auth/permissions.ts`, `src/modules/auth/actions/*`, `src/components/dashboard/ImpersonationBanner.tsx`, `src/components/dashboard/ImpersonationSelector.tsx` | REFACTOR: Arquitetura de impersonation completamente refatorada — VIEW_MODE genérico abolido; modelo específico por usuário via cookies HTTP-Only `janus_impersonated_user_id` + `janus_impersonated_user_name`; `checkPermission()` auto-detecta e aplica permissões do alvo; banner vermelho com nome do usuário; modal de seleção com busca |
| 2026-05-19 | `prisma/schema.prisma` | FEAT: Adicionado parentId (hierarquia) + seoTitle/seoDescription/seoKeywords em BlogCategory e BlogTag |
| 2026-05-19 | `getBlogCategories.ts`, `getBlogTags.ts` | FEAT: Queries agora incluem parent e children das entidades blog |
| 2026-05-19 | `createBlogCategory.ts`, `updateBlogCategory.ts`, `createBlogTag.ts`, `updateBlogTag.ts` | FEAT: Actions atualizadas para persistir parentId e campos SEO |
| 2026-05-19 | `src/components/blog/BlogTabNav.tsx` | NOVO: Tab navigation (Publicações/Categorias/Tags) com active state |
| 2026-05-19 | `src/components/blog/BlogManagementHeader.tsx` | NOVO: Header do painel de gerenciamento do blog |
| 2026-05-19 | `src/components/blog/CategoriesClient.tsx` | REESCRITO: Layout 2 colunas com painel inline de edição, SEO e hierarquia |
| 2026-05-19 | `src/components/blog/TagsClient.tsx` | REESCRITO: Layout 2 colunas com painel inline de edição, SEO e hierarquia |
| 2026-05-19 | `src/components/blog/PostsListClient.tsx` | FEAT: Extraído BlogPostsTable como sub-componente reutilizável |
| 2026-05-19 | `src/components/blog/PostEditorClient.tsx` | REESCRITO: Layout 2 colunas (corpo + sidebar organização/SEO), sem abas |
| 2026-05-19 | `src/components/dashboard/Sidebar.tsx` | FEAT: Blog simplificado para link direto (sem sub-itens colapsáveis) |
| 2026-05-19 | `CategoryModal.tsx`, `TagModal.tsx` | REMOVIDO: Substituídos pelo painel inline nos clientes de categorias e tags |
| 2026-05-19 | 6 páginas blog (sites + lp): posts, categories, tags | FEAT: Adicionado BlogManagementHeader com tab navigation em todas as páginas |
| 2026-05-19 | `PostsListClient.tsx` | REESCRITO: data table avançado com paginação, page size 10/25/50, colunas ocultáveis, multi-select, bulk delete e sort |
| 2026-05-19 | `PostsListClient.tsx` | UX: toolbar unificada com ícones (+/sliders/filter/trash) + page size + contagem + paginação em uma linha; footer removido |
| 2026-05-19 | `CategoriesClient.tsx`, `TagsClient.tsx` | FEAT: Reactive UI (onCreated/onUpdated sem reload) + quick-create pai inline + useCallback estável |
| 2026-05-19 | 4 páginas new/edit de posts (sites + lp) | FIX: authorName via `db.user.findUnique` (name real) em vez de `session.user.name` (sempre undefined) |
| 2026-05-20 | `prisma/schema.prisma` | FEAT: Adicionado `isActive Boolean @default(true)` em BlogCategory e BlogTag |
| 2026-05-20 | `createBlogCategory.ts`, `updateBlogCategory.ts`, `createBlogTag.ts`, `updateBlogTag.ts` | FEAT: Zod schema + Prisma upsert agora persistem campo `isActive` |
| 2026-05-20 | `deleteBlogCategory.ts`, `deleteBlogTag.ts` | FIX: Transaction que orfa subcategorias/sub-tags antes de deletar pai |
| 2026-05-20 | `getBlogCategories.ts`, `getBlogTags.ts` | FEAT: children select inclui `isActive` |
| 2026-05-20 | `CategoriesClient.tsx` | REESCRITO: 3 colunas (Categorias / Subcategorias / Painel), imagem-first, isActive toggle, trash+modal, sem parentId selector |
| 2026-05-20 | `TagsClient.tsx` | REESCRITO: 3 colunas (Tags / Sub-tags / Painel), imagem-first, isActive toggle, trash+modal, sem parentId selector |
| 2026-05-20 | `SiteContentEditClient.tsx` | FEAT: Modo avançado refatorado para 3 colunas (Menu Seções → Iframe → Editor Contextual); seção title adicionado; scroll em column 3 corrigido; selected button com background sólido |
| 2026-05-20 | `updatePageAdvancedContent.ts` | NOVO: Action para modo avançado salvar em `contentData` (não toca `schemaData`); segurança contra sobrescita ao alternar modos |
| 2026-05-21 | `prisma/schema.prisma` | FEAT: BlogPostStatus enum; BlogPost.status + publishedAt (nullable) + authorId FK; BlogPostCategory M:N substituindo categoryId |
| 2026-05-21 | `getCompanyUsers.ts` | NOVO: Query lista usuários da empresa para select de autor nos artigos |
| 2026-05-21 | `getBlogPosts.ts`, `getBlogPost.ts` | FEAT: Includes atualizados para categories M:N, author, tags; orderBy publishedAt asc nulls last |
| 2026-05-21 | `createBlogPost.ts`, `updateBlogPost.ts` | FEAT: status/authorId/categoryIds[]; publishedAt auto; re-publish sem zerar data; categories full-replace |
| 2026-05-21 | 4 páginas new/edit posts (sites + lp) | FEAT: Adicionado getCompanyUsers ao Promise.all; companyUsers prop passado ao PostEditorClient |
| 2026-05-21 | `PostEditorClient.tsx` | REESCRITO: status toggle, select autor com avatar, cascade multi-select categorias, sem authorName prop |
| 2026-05-21 | `PostsListClient.tsx` | REESCRITO: filtros rápidos Status/Autor/Categoria, D&D colunas, modal bulk delete (autoFocus Cancel), lápis edit |
| 2026-05-21 | `api/[companySlug]/[projectId]/blog/route.ts` | FIX: categories[] em vez de category; filtro status PUBLISHED + publishedAt not null |
| 2026-05-21 | `api/[companySlug]/[projectId]/blog/[postId]/route.ts` | FIX: categories[] em vez de category; filtro status PUBLISHED |
| 2026-05-21 | `api/[companySlug]/blog/route.ts` | FIX: categories[] em vez de category; filtro status PUBLISHED + publishedAt not null |
| 2026-05-17 | `src/components/ui/SlugInput.tsx` | NOVO: Componente reutilizável de input de slug com validação em tempo real; sanitiza a-z, 0-9, hífen; feedback visual de erro |
| 2026-05-17 | `CreatePageModal.tsx`, `EditPageModal.tsx`, `CompaniesClient.tsx`, `AdminCompaniesClient.tsx`, `CreateCompanyModal.tsx` | FIX: Substituição de inputs raw slug pelo componente SlugInput com validação live |
| 2026-05-17 | `src/modules/projects/actions/createPage.ts` + 10 actions | FIX: `session.user.companySlug` undefined para DEVELOPER — adicionado guard `&& session.user.companySlug` antes de comparar |
| 2026-05-17 | `src/modules/dev/actions/createCompany.ts`, `editCompany.ts`, `deleteCompany.ts` | FIX: Permite ADMIN criar/editar/excluir empresas no painel dev |
| 2026-05-17 | `src/modules/dev/queries/getCompanies.ts`, `getRecentCompanies.ts`, `getRecentUsers.ts`, `getRecentProjects.ts`, `getUsers.ts` | FIX: Adicionado parâmetro `devId` para usar URL params em vez de session.user.id |
| 2026-05-17 | `src/app/dev/[devId]/dashboard/settings/page.tsx` | FIX: Usa `devId` da URL em vez de `session.user.id` para buscar configurações do dev |
| 2026-05-17 | `src/app/dashboard-admin/developers/page.tsx` + `AdminDevelopersClient.tsx` | FIX: Modal de seleção de empresa só mostra empresas criadas pelo dev selecionado |
| 2026-05-17 | `builder/page.tsx` (sites + landing-pages), `preview/page.tsx` | FIX: Slug vazio/`/` gera endpoint com `home` em vez de `//` |
| 2026-05-17 | `src/lib/auth/permissions.ts` | FEAT: Adicionado `IMPERSONATED_DEV_ID_COOKIE`, `getImpersonatedDevId()`; `hasPermission()` trata VIEW_MODE_DEV igual a VIEW_MODE_USER |
| 2026-05-17 | `src/modules/admin/queries/getAdminDevelopers.ts` | FEAT: Adicionado `company: { select: { slug: true } }` ao select |
| 2026-05-17 | `src/modules/auth/actions/viewAsDeveloper.ts` | NOVO: seta DEV_MODE + IMPERSONATED_DEV_ID_COOKIE, limpa IMPERSONATED_USER_ID_COOKIE, redireciona |
| 2026-05-17 | `src/modules/auth/actions/toggleViewMode.ts` | FEAT: Adicionado `toggleDevViewMode()` para ADMIN alternar DEV_MODE |
| 2026-05-17 | `src/modules/auth/queries/getImpersonatedDevPermissions.ts` | NOVO: lê cookie dev impersonado, busca permissions no DB |
| 2026-05-17 | `src/components/dashboard/DevPermissionsModal.tsx` | NOVO: modal de permissões do dev impersonado (análogo a UserPermissionsModal) |
| 2026-05-17 | `src/components/dashboard/ImpersonationBanner.tsx` | FEAT: Suporte a DEV_MODE — novas props isSimulatingDev/impersonatedDev*; toggle handleDevToggle; abre DevPermissionsModal |
| 2026-05-17 | `src/app/[companySlug]/dashboard/layout.tsx` | FEAT: DEV_MODE — busca nome+permissões do dev impersonado; passa props para ImpersonationBanner |
| 2026-05-17 | `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx` | FEAT: Botão LayoutDashboard chama viewAsDeveloper(dev.id, dev.company.slug) em vez de Link |
| 2026-05-24 | `src/components/ui/AdminDataTable.tsx` | REESCRITO: Toolbar unificada com + ícone, SlidersHorizontal, ListFilter, Trash2 sempre-visível, busca flex-1, page size, contagem, paginação — tudo em uma linha; prop `newButton` substituiu `headerRight`; chips de filtros dentro do card com border-b |
| 2026-05-24 | `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx` | UX: `newButton` ícone + substituído `headerRight`; trash removido de renderRowActions (exclusão apenas via bulk select); `DeleteAlertModal` single-delete removido |
| 2026-05-24 | `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx` | UX: `newButton` ícone; trash removido de renderRowActions; `DeleteAlertModal`+`deleteTarget`+`isDeleting`+`handleDelete` removidos |
| 2026-05-24 | `src/app/dashboard-admin/users/AdminUsersClient.tsx` | UX: `newButton` ícone; trash removido de renderRowActions; `DeleteAlertModal`+`deleteTarget`+`isDeleting`+`handleDelete` removidos |
| 2026-05-17 | `sites/page.tsx`, `landing-pages/page.tsx`, `sites/[siteId]/pages/page.tsx`, `landing-pages/[lpId]/pages/page.tsx` | FEAT: Adicionado else-if VIEW_MODE_DEV com getImpersonatedDevPermissions() |
| 2026-05-12 | `src/modules/admin/queries/getAdminUsers.ts` | Adicionado campo `requiresPasswordReset` ao select |
| 2026-05-12 | `src/app/dashboard-admin/users/AdminUsersClient.tsx` | Adicionada coluna "Senha" com status Redefinida/Pendente |
| 2026-05-12 | `src/app/dev/[devId]/dashboard/settings/DevSettingsClient.tsx` | Adicionada seção visual de status de redefinição de senha |
| 2026-05-12 | `src/app/dev/[devId]/dashboard/settings/page.tsx` | Adicionado `requiresPasswordReset` ao select e props |
| 2026-05-12 | `src/app/dashboard-admin/settings/page.tsx` | Adicionado `requiresPasswordReset` ao select e props |
| 2026-05-12 | `src/modules/users/actions/signInAction.ts` | FIX: Retorna `redirectUrl` em vez de usar `redirect()` dentro de useActionState |
| 2026-05-12 | `src/components/auth/LoginForm.tsx` | FIX: Adiciona `useRouter` e `useEffect` para fazer redirect após sucesso do login |
| 2026-05-12 | `src/modules/users/actions/signInAction.ts` | FIX: Adiciona try/catch com console.error para debugar erro na autenticação |
| 2026-05-12 | `src/lib/auth.config.ts` | FIX: Adiciona rota `/first-access` explicitamente no callback authorized |
| 2026-05-12 | `prisma/schema.prisma` | FEAT: Adicionado `createdById` em Company e User para rastrear criador |
| 2026-05-12 | `getAdminUsers.ts` + `getAdminCompanies.ts` | FEAT: Filtra por `createdById` do admin logado |
| 2026-05-12 | `adminCreateCompany.ts` + `adminCreateUser.ts` | FEAT: Salva `createdById` com id do admin ao criar |
| 2026-05-12 | `src/app/globals.css` | FEAT: Adicionadas variáveis `--brand-cta` (#E35336) e `--brand-cta-hover` (light + dark) |
| 2026-05-12 | `tailwind.config.ts` | FEAT: Mapeados `brand.cta` e `brand.cta-hover` no tema Tailwind |
| 2026-05-12 | `src/components/ui/button.tsx` | FEAT: Variant `default` agora usa `bg-brand-cta` (#E35336) em vez de `bg-primary` |
| 2026-05-12 | `.claude/skills/ui-design.md` | DOCS: Adicionada regra de uso de `brand-cta` para botões CTA primários |
| 2026-05-13 | `prisma/schema.prisma` | FEAT: Adicionados BlogCategory, BlogTag, BlogPost, BlogPostTag; blogEnabled em Project |
| 2026-05-13 | `src/modules/blog/**` | FEAT: Módulo completo de Blog — 10 actions + 4 queries |
| 2026-05-13 | `src/components/blog/**` | FEAT: RichEditor (Tiptap), CategoryModal, TagModal, CategoriesClient, TagsClient, PostsListClient, PostEditorClient |
| 2026-05-13 | `src/app/.../sites/[siteId]/blog/**` | FEAT: 5 páginas de blog para Sites (posts, new, edit, categories, tags) |
| 2026-05-13 | `src/app/.../landing-pages/[lpId]/blog/**` | FEAT: 5 páginas de blog para Landing Pages |
| 2026-05-13 | `src/components/dashboard/Sidebar.tsx` | FEAT: Submenu Blog colapsável (fetch dinâmico de blogEnabled via API) |
| 2026-05-13 | `src/components/projects/EditProjectModal.tsx` | FEAT: Switch para ativar/desativar blog por projeto |
| 2026-05-13 | `src/app/api/projects/[projectId]/blog-enabled/route.ts` | FEAT: Endpoint GET para o Sidebar verificar blogEnabled |
| 2026-05-13 | `src/lib/slug.ts` | FEAT: Utilitário generateSlug (normaliza acentos, lowercase, hífens) |
| 2026-05-13 | `src/app/api/dev/companies/[companyId]/projects/route.ts` | FEAT: Endpoint GET para dev listar projetos de uma empresa (blog management) |
| 2026-05-13 | `src/modules/dev/queries/getCompanyProjects.ts` | FEAT: Query para dev buscar projetos de uma empresa |
| 2026-05-13 | `src/modules/admin/actions/updateProjectBlogEnabled.ts` | FEAT: Action para dev ativar/desativar blog em projetos |
| 2026-05-13 | `src/components/dev/ProjectsBlogModal.tsx` | FEAT: Modal para dev gerenciar blog de múltiplos projetos de uma empresa |
| 2026-05-13 | `src/app/dev/[devId]/dashboard/companies/CompaniesClient.tsx` | FEAT: Integrado botão BookOpen para abrir ProjectsBlogModal |
| 2026-05-13 | `src/lib/auth.config.ts` | FEAT: Impersonation — ADMIN pode acessar rotas /dev/[devId]/dashboard |
| 2026-05-13 | `src/app/[companySlug]/dashboard/layout.tsx` | FEAT: Impersonation — bypass ADMIN + banner "Modo Administrador" com link Voltar |
| 2026-05-13 | `src/app/dev/[devId]/dashboard/layout.tsx` | FEAT: Impersonation — bypass ADMIN + banner com nome do dev + link Voltar |
| 2026-05-13 | `src/modules/projects/actions/*.ts` (8 actions) | FEAT: Impersonation — ADMIN bypassa checks de companySlug em todas as actions |
| 2026-05-13 | `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx` | FEAT: Botão "Acessar Painel" (LayoutDashboard) na coluna Ações, mesmo tab |
| 2026-05-13 | `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx` | FEAT: Coluna Ações com botão "Acessar Painel Dev" (LayoutDashboard), mesmo tab |
| 2026-05-13 | `src/app/[companySlug]/dashboard/**` | FIX: Botões CTA primários migrados para `bg-brand-cta hover:bg-brand-cta-hover` (skill ui-design) |
| 2026-05-13 | `src/components/projects/CreateProjectModal.tsx` + `CreatePageModal.tsx` | FIX: Botões submit criar agora usam `bg-brand-cta` |
| 2026-05-13 | `src/components/projects/EditPageModal.tsx` | FIX: Botão Salvar agora usa `bg-brand-cta` |
| 2026-05-13 | `src/components/projects/EditProjectActions.tsx` + `EditProjectButton.tsx` | FIX: Botões Editar e Salvar inline agora usam `bg-brand-cta` |
| 2026-05-13 | `src/app/[companySlug]/dashboard/settings/settings.client.tsx` | FIX: Buttons 'Salvar' e 'Atualizar Senha' usam variant default do shadcn (bg-brand-cta) |
| 2026-05-13 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` + `landing-pages/[lpId]/pages/page.tsx` | FIX: Lista de páginas responsiva (flex-col mobile, overflow-x-auto, min-w) |
| 2026-05-13 | `src/components/dashboard/Sidebar.tsx` + `AdminSidebar.tsx` + `DevSidebar.tsx` | FIX: Remove `display:flex` inline que sobrescrevia `hidden md:flex`; drawer mobile sem collapse |
| :--------- | :-------------------------------------------- | :--------------------------------------------------------- |
| 2026-05-05 | `prisma/schema.prisma`                        | Model User com enum UserRole (ADMIN/DEFAULT), soft delete  |
| 2026-05-05 | `src/modules/users/domain/User.ts`            | Entidade User: create, reconstitute, toObject              |
| 2026-05-05 | `src/modules/users/domain/errors.ts`          | 4 erros de domínio tipados                                 |
| 2026-05-05 | `src/modules/users/actions/registerUser.ts`   | Action: registra usuário com bcrypt                        |
| 2026-05-05 | `src/modules/users/actions/signInAction.ts`   | Form action para login via Auth.js                         |
| 2026-05-05 | `src/modules/users/queries/getUserByEmail.ts` | Query: busca usuário por email (soft delete)               |
| 2026-05-05 | `src/lib/auth.ts`                             | NextAuth v5: Credentials + JWT + callbacks                 |
| 2026-05-05 | `src/lib/prisma.ts`                           | Atualizado para Prisma 7 (accelerateUrl)                   |
| 2026-05-05 | `middleware.ts`                               | Proteção das rotas /dashboard com Auth.js                  |
| 2026-05-05 | `src/components/auth/LoginForm.tsx`           | Form de login Client Component (useActionState)            |
| 2026-05-05 | `src/app/(auth)/login/page.tsx`               | Página de login Server Component                           |
| 2026-05-05 | `src/app/(dashboard)/layout.tsx`              | Layout protegido com verificação de sessão                 |
| 2026-05-05 | `src/app/globals.css`                         | Variáveis CSS brand palette                                |
| 2026-05-05 | `tailwind.config.ts`                          | Cores brand no Tailwind config                             |
| 2026-05-05 | `src/types/next-auth.d.ts`                    | Augmentação de tipos Session/JWT                           |
| 2026-05-05 | `docs/postman/auth_collection.json`           | Coleção Postman: endpoints Auth.js                         |
| 2026-05-05 | `.env.example`                                | Template de variáveis de ambiente                          |
| 2026-05-05 | `src/modules/users/domain/User.spec.ts`       | 6 testes unitários do domínio User                         |
| 2026-05-06 | `src/lib/auth.config.ts`                      | Implementado padrão oficial Auth.js v5: session JWT + callback authorized      |
| 2026-05-06 | `middleware.ts`                               | Simplificado para NextAuth(authConfig).auth (padrão oficial)                   |
| 2026-05-07 | `prisma/schema.prisma`                        | Adicionado model LoginAttempt para Brute Force Protection                      |
| 2026-05-07 | `src/lib/auth.ts`                             | Adicionado IP blocking (3+ falhas em 1h) e gravação de tentativas              |
| 2026-05-07 | `src/modules/admin/queries/getLoginLogs.ts`   | Queries para listar tentativas falhas por limite ou por IP                     |
| 2026-05-07 | `src/modules/admin/actions/unblockIp.ts`      | Action admin-only para desbloquear IP                                          |
| 2026-05-07 | `src/lib/auth.ts`                             | FIX: tratamento gracioso quando tabela login_attempts não existe               |
| 2026-05-07 | `src/lib/auth.spec.ts`                        | Novo arquivo: testes para error handling da tabela LoginAttempt               |
| 2026-05-07 | `src/test/create-test-user.spec.ts`           | Novo arquivo: 5 fases de teste para criar usuário teste2@gmail.com            |
| 2026-05-07 | `scripts/seed-test-user.ts`                   | Novo script: seed para criar usuário de teste (npm run db:seed-test)           |
| 2026-05-07 | `scripts/test-db-connection.ts`               | Novo script: testa conectividade com PostgreSQL (npm run db:test-connection)   |
| 2026-05-07 | `SETUP_TEST_USER.md`                          | Documentação: guia de setup e uso do usuário de teste                         |
| 2026-05-07 | `scripts/seed-test-user.ts`                   | FIX: adicionado import dotenv/config para carregar variáveis de ambiente       |
| 2026-05-06 | `src/modules/auth/actions/checkIpStatus.ts`   | Novo: Server Action para verificar status de bloqueio do IP                   |
| 2026-05-06 | `src/components/auth/LoginForm.tsx`           | Refatorado: Client Component com countdown MM:SS, overlay bloqueio #514030     |
| 2026-05-06 | `src/modules/users/actions/signInAction.ts`   | Adicionado tratamento específico para erro IP_BLOCKED                         |
| 2026-05-06 | `src/components/dashboard/Sidebar.tsx`        | Novo: Server Component sidebar reutilizável, menu items, user info, logout    |
| 2026-05-06 | `src/app/(dashboard)/layout.tsx`              | Refatorado: flex layout com Sidebar integrada, children como main content     |
| 2026-05-06 | `src/app/(dashboard)/page.tsx`                | Novo: Dashboard principal com header, banner, cards Sites/Landing Pages       |
| 2026-05-06 | `src/app/page.tsx`                            | Refatorado: redirect() para /dashboard                                         |
| 2026-05-06 | `src/app/dashboard/layout.tsx`                | Movido de (dashboard) para dashboard                                           |
| 2026-05-06 | `src/app/dashboard/page.tsx`                  | Movido de (dashboard) para dashboard                                           |
| 2026-05-06 | `prisma/schema.prisma`                        | User: adicionados campos image (String?) e preferences (Json? default {})     |
| 2026-05-06 | `prisma/migrations/…_update_user_ui_fields`   | Migration: add user_image e preferences ao model users                         |
| 2026-05-06 | `src/app/globals.css`                         | body bg #EBE6DA; vars sidebar-bg, sidebar-icon, sidebar-hover-bg/text         |
| 2026-05-06 | `src/types/next-auth.d.ts`                    | Adicionado UserPreferences, image e preferences na Session/JWT                |
| 2026-05-06 | `src/lib/auth.config.ts`                      | jwt/session callbacks propagam image e preferences                            |
| 2026-05-06 | `src/lib/auth.ts`                             | authorize retorna image e preferences junto com user                          |
| 2026-05-06 | `src/modules/users/queries/getUserByEmail.ts` | select inclui image e preferences                                             |
| 2026-05-06 | `src/modules/users/actions/updatePreferences.ts` | Novo: Server Action para persistir UserPreferences no banco                |
| 2026-05-06 | `src/components/dashboard/Sidebar.tsx`        | Refatorado: Server Component passa defaultCollapsed e dados para SidebarClient|
| 2026-05-06 | `src/components/dashboard/SidebarClient.tsx`  | Novo: Client Component sidebar colapsável com hover, logo next/image, logout  |
| 2026-05-06 | `public/janus-logo.svg`                       | Logo SVG do Janus para uso na sidebar                                         |
| 2026-05-06 | `src/components/dashboard/SidebarClient.tsx`  | UX: useOptimistic p/ toggle, logo dinâmica 48→28px, PanelLeft icons, UserCircle fallback |
| 2026-05-07 | `src/lib/auth.config.ts`                      | FIX HTTP 431: preferences removido do JWT; callbacks propagam apenas id, role, image     |
| 2026-05-07 | `src/types/next-auth.d.ts`                    | FIX: preferences removido de Session/JWT; UserPreferences mantido como tipo exportado    |
| 2026-05-07 | `src/app/dashboard/layout.tsx`                | Refatorado: busca preferences e image do DB; passa initialCollapsed como prop à Sidebar  |
| 2026-05-07 | `src/modules/users/actions/updatePreferences.ts` | Adicionado revalidatePath('/dashboard', 'layout') após update                         |
| 2026-05-07 | `src/components/dashboard/Sidebar.tsx`        | Refatorado: Client Component unificado (useState + startTransition, sem useOptimistic)   |
| 2026-05-07 | `src/components/dashboard/SidebarClient.tsx`  | DELETADO: lógica absorvida por Sidebar.tsx                                               |
| 2026-05-09 | `prisma/schema.prisma`                        | **REFACTOR:** Adicionados models Company, Project, Page, ProjectHistory; User agora tem companyId obrigatório |
| 2026-05-09 | `prisma/migrations/20260509232658_add_multi_tenant_architecture` | **MIGRATION:** Cria estrutura Multi-Tenant; default company; atualiza users com companyId |
| 2026-05-09 | `src/lib/auth.ts`                             | **REFACTOR:** authorize busca user.company; retorna companySlug no token       |
| 2026-05-09 | `src/lib/auth.config.ts`                      | **REFACTOR:** callback authorized valida companySlug; redireciona para /{companySlug}/dashboard |
| 2026-05-09 | `src/types/next-auth.d.ts`                    | **REFACTOR:** Adicionado companySlug em Session/JWT/User                      |
| 2026-05-09 | `src/app/page.tsx`                            | **REFACTOR:** Redireciona para /{companySlug}/dashboard da empresa do usuário  |
| 2026-05-09 | `src/app/[companySlug]/dashboard/layout.tsx`  | **NOVO:** Layout protegido; valida companySlug do usuário vs. params          |
| 2026-05-09 | `src/app/[companySlug]/dashboard/page.tsx`    | **NOVO:** Dashboard principal refatorado para rota dinâmica [companySlug]     |
| 2026-05-09 | `src/app/dashboard/`                          | **DELETADO:** Pasta antiga removida; estrutura movida para [companySlug]      |
| 2026-05-09 | `src/modules/users/actions/registerUser.ts`   | **REFACTOR:** Agora associa novo usuário à default company                   |
| 2026-05-09 | `scripts/seed-test-user.ts`                   | **REFACTOR:** Cria empresa "test-company", projeto e página de teste completos |
| 2026-05-09 | `SETUP_TEST_USER.md`                          | **REESCRITO:** Documentação atualizada para Multi-Tenant, inclui fluxo de auth |
| 2026-05-09 | `src/lib/auth.config.ts`                      | **FIX:** Refatorado authorized callback; extrai companySlug; redireciona root e login para /{slug}/dashboard |
| 2026-05-09 | `src/modules/users/actions/signInAction.ts`   | **FIX:** Removido hardcode redirectTo: '/dashboard'; usa redirect: true para middleware processar |
| 2026-05-09 | (merge) `feat/multi-tenant-architecture` → `main` | **MERGE:** Integração de Multi-Tenant no branch principal |
| 2026-05-09 | `src/modules/projects/queries/getProjects.ts` | **NOVO:** Query para buscar projetos da empresa com filtro por tipo |
| 2026-05-09 | `src/app/[companySlug]/dashboard/page.tsx`    | **REFACTOR:** Dashboard agora busca dados reais de projetos; exibe estatísticas dinâmicas |
| 2026-05-09 | `src/app/[companySlug]/dashboard/sites/page.tsx` | **NOVO:** Página de listagem de sites com grid de cards e botões de ação |
| 2026-05-09 | `src/app/[companySlug]/dashboard/landing-pages/page.tsx` | **NOVO:** Página de listagem de landing pages com mesmo padrão |
| 2026-05-09 | `src/modules/projects/queries/getPagesByProjectId.ts` | **NOVO:** Query para buscar páginas de um projeto específico |
| 2026-05-09 | `src/components/dashboard/ContextSidebar.tsx` | **NOVO:** Sidebar de contexto para navegação dentro de projetos |
| 2026-05-09 | `src/app/[companySlug]/dashboard/sites/[siteId]/layout.tsx` | **NOVO:** Layout aninhado para contexto de site |
| 2026-05-09 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/layout.tsx` | **NOVO:** Layout aninhado para contexto de landing page |
| 2026-05-09 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` | **NOVO:** Listagem de páginas com botão Editar → builder |
| 2026-05-09 | `src/app/[companySlug]/dashboard/sites/[siteId]/analytics/page.tsx` | **NOVO:** Tela de resultados/analytics (placeholder) |
| 2026-05-09 | `src/app/[companySlug]/dashboard/sites/[siteId]/blog/page.tsx` | **NOVO:** Tela de blog (placeholder) |
| 2026-05-09 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/page.tsx` | **NOVO:** Listagem de páginas para landing pages |
| 2026-05-09 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/analytics/page.tsx` | **NOVO:** Tela de resultados para landing pages |
| 2026-05-09 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/page.tsx` | **NOVO:** Tela de blog para landing pages |
| 2026-05-09 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/builder/page.tsx` | **NOVO:** Construtor low-code visual com 3 colunas (componentes, canvas, propriedades) |
| 2026-05-09 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/builder/page.tsx` | **NOVO:** Mesmo construtor para landing pages |
| 2026-05-09 | `CoreRenderer.tsx` | **NOVO:** Componente de renderização pura HTML separado da lógica de edição |
| 2026-05-09 | `RenderNode.tsx` | **REFACTOR:** Agora é wrapper de edição com feedback visual (ring azul + tag) |
| 2026-05-09 | `Canvas.tsx` | **REFACTOR:** Atualizado para novo contrato de props do RenderNode |
| 2026-05-09 | `PropertiesPanel.tsx` | **REFACTOR:** Reescrito com seções contextuais (Layout, Tipografia, Aparência) |
| 2026-05-09 | `preview/page.tsx` | **REFACTOR:** Usa CoreRenderer diretamente (sem wrapper de edição) |
| 2026-05-09 | `page.client.tsx` (builders) | **FIX:** Adicionado useIsMounted hook e id="dnd-builder" para corrigir Hydration Mismatch |
| 2026-05-09 | `updatePageContent.ts` | **FIX:** Adicionado revalidatePath após publicar página |
| 2026-05-09 | `preview/page.tsx` | **FIX:** Preview agora permite acesso ao dono/admin mesmo quando não publicado |
| 2026-05-09 | `PropertiesPanel.tsx` | **FEATURE:** Adicionada seção Configurações da Página (backgroundColor) |
| 2026-05-09 | `ComponentsPanel.tsx` | **FEATURE:** Adicionado Painel de Camadas com abas (Componentes/Camadas) |
| 2026-05-09 | `Canvas.tsx` | **FEATURE:** Suporte a backgroundColor do pageSettings |
| 2026-05-09 | `ComponentsPanel.tsx` | **REFACTOR:** Layout de componentes em grid 2x2 com ícones do lucide-react |
| 2026-05-09 | `LayoutForm.tsx` | **NOVO:** Formulário modular para edição de propriedades de layout (flex/grid, dimensões) |
| 2026-05-09 | `PropertiesPanel.tsx` | **FEATURE:** Edição avançada de Section/Container com controles visuais de layout |
| 2026-05-09 | `ComponentsPanel.tsx` | **FEATURE:** Painel de Camadas com SortableContext para reordenação via drag-and-drop |
| 2026-05-09 | `ComponentsPanel.tsx` | **FEATURE:** Botão de exclusão com modal de confirmação em cada camada |
| 2026-05-09 | `PropertiesPanel.tsx` | **FEATURE:** Abas Elemento/Global com configurações globais (cor de fundo, texto, fonte) |
| 2026-05-09 | `CoreRenderer.tsx` | **FEATURE:** Adicionados cases 'Divider' e 'Video' com renderização condicional |
| 2026-05-09 | `preview/page.tsx` | **FEATURE:** Sincronização de Global Settings aplicados no preview |
| 2026-05-09 | `page.client.tsx` (builders) | **FEATURE:** Feedback visual com toast e useTransition nos botões Salvar/Publicar |
| 2026-05-09 | `updatePageContent.ts` | **REFACTOR:** Salva formato { nodes, globalSettings } no banco de dados |
| 2026-05-09 | `use-toast.ts` | **NOVO:** Hook customizado para sistema de toast (sucesso/erro) |
| 2026-05-09 | `ToastContainer.tsx` | **NOVO:** Componente de exibição de toasts com animação e auto-dismiss |
| 2026-05-09 | `PropertiesPanel.tsx` | **FEATURE:** Abas Elemento/Global com configurações globais (cor de fundo, texto, fonte) |
| 2026-05-09 | `src/lib/auth.config.ts` | **FEATURE:** Adicionado registro das novas features no PROJECT.md |
| 2026-05-09 | `ComponentsPanel.tsx` | **FEATURE:** Adicionado Painel de Camadas com abas (Componentes/Camadas) |
| 2026-05-09 | `Canvas.tsx` | **FEATURE:** Suporte a backgroundColor do pageSettings |
| 2026-05-09 | `ComponentsPanel.tsx` | **REFACTOR:** Layout de componentes em grid 2x2 com ícones do lucide-react |
| 2026-05-09 | `LayoutForm.tsx` | **NOVO:** Formulário modular para edição de propriedades de layout (flex/grid, dimensões) |
| 2026-05-09 | `PropertiesPanel.tsx` | **FEATURE:** Edição avançada de Section/Container com controles visuais de layout |
| 2026-05-09 | `ComponentsPanel.tsx` | **FEATURE:** Painel de Camadas com SortableContext para reordenação via drag-and-drop |
| 2026-05-09 | `ComponentsPanel.tsx` | **FEATURE:** Botão de exclusão com modal de confirmação em cada camada |
| 2026-05-09 | `PropertiesPanel.tsx` | **FEATURE:** Abas Elemento/Global com configurações globais (cor de fundo, texto, fonte) |
| 2026-05-09 | `CoreRenderer.tsx` | **FEATURE:** Adicionados cases 'Divider' e 'Video' com renderização condicional |
| 2026-05-09 | `preview/page.tsx` | **FEATURE:** Sincronização de Global Settings aplicados no preview |
| 2026-05-09 | `page.client.tsx` (builders) | **FEATURE:** Feedback visual com toast e useTransition nos botões Salvar/Publicar |
| 2026-05-09 | `updatePageContent.ts` | **REFACTOR:** Salva formato { nodes, globalSettings } no banco de dados |
| 2026-05-09 | `use-toast.ts` | **NOVO:** Hook customizado para sistema de toast (sucesso/erro) |
| 2026-05-09 | `ToastContainer.tsx` | **NOVO:** Componente de exibição de toasts com animação e auto-dismiss |
| 2026-05-09 | `use-builder.ts` | **FIX:** Corrigidos tipos TypeScript - interface EditorNode usa `Record<string, unknown>` ao invés de `any` |
| 2026-05-09 | `use-builder.ts` | **FEATURE:** Implementado motor de histórico completo (past, present, future) com undo/redo |
| 2026-05-09 | `use-builder.ts` | **FEATURE:** Adicionadas funções auxiliares tipadas: updateNodeInTree, deleteNodeFromTree, findNodeByIdRecursive, findParentNodeRecursive |
| 2026-05-09 | `PropertiesPanel.tsx` | **FIX:** Corrigidos erros de tipo em acessos a node.props usando type assertions |
| 2026-05-09 | `PropertiesPanel.tsx` | **FIX:** Adicionadas guardas de null para node antes de acessar propriedades |
| 2026-05-09 | `VideoPlayer.tsx` | **FIX:** Corrigidos tipos de props usando type assertions para string |
| 2026-05-09 | `LayerItem.tsx` | **NOVO:** Componente recursivo para renderização de camadas aninhadas com expand/collapse |
| 2026-05-09 | `VideoPlayer.tsx` | **NOVO:** Componente de controles de vídeo com URL, autoplay, mute, loop, dimensões |
| 2026-05-09 | `low-editor.md` | **DOCS:** Criada documentação completa da arquitetura Low-Code em `.claude/contexto/low-editor.md` |
| 2026-05-09 | `page.client.tsx` | **REFACTOR:** Atualizado para usar novas funções undo/redo do useBuilder com canUndo/canRedo |
| 2026-05-10 | `Sidebar.tsx` | **FIX:** Corrigida navegação dinâmica para multi-tenant com useParams e companySlug |
| 2026-05-10 | `ContextSidebar.tsx` | **VERIFIED:** Componente já utiliza navegação dinâmica com companySlug via props |
| 2026-05-10 | `updatePageContent.ts` | **VERIFIED:** revalidatePath já utiliza companySlug dinâmico da sessão |
| 2026-05-10 | `updatePreferences.ts` | **FIX:** Corrigido revalidatePath para usar companySlug dinâmico da sessão |
| 2026-05-10 | `createProject.ts` | **NOVO:** Server Action para criação de projetos com validação de empresa e criação automática da página Home |
| 2026-05-10 | `create-project-modal.tsx` | **NOVO:** Modal reutilizável com shadcn/ui para criação de projetos, loading states e redirecionamento automático |
| 2026-05-10 | `sites/page.tsx` | **FEATURE:** Botões "Novo Site" e "Criar primeiro site" agora utilizam CreateProjectModal funcional |
| 2026-05-10 | `landing-pages/page.tsx` | **FEATURE:** Botões "Nova Landing Page" e "Criar primeira landing page" agora utilizam CreateProjectModal funcional |
| 2026-05-10 | `CreateProjectModal.tsx` | **REFACTOR:** Recriado componente seguindo skills frontend - useActionState, shadcn/ui e camelCase |
| 2026-05-10 | `input.tsx` | **NOVO:** Componente UI shadcn/ui para inputs |
| 2026-05-10 | `label.tsx` | **NOVO:** Componente UI shadcn/ui para labels |
| 2026-05-10 | `dialog.tsx` | **NOVO:** Componente UI shadcn/ui para modais |
| 2026-05-10 | `updateProject.ts` | **NOVO:** Server Action para atualizar nome de projetos com revalidatePath |
| 2026-05-10 | `updatePage.ts` | **NOVO:** Server Action para atualizar nome/slug de páginas com revalidatePath |
| 2026-05-10 | `EditProjectModal.tsx` | **NOVO:** Modal para edição de dados do projeto com useActionState |
| 2026-05-10 | `EditPageModal.tsx` | **NOVO:** Modal para edição de dados da página (nome/slug) com useActionState |
| 2026-05-10 | `sites/page.tsx` | **REFACTOR:** Botão Editar agora abre modal para dados, separado de Gerenciar |
| 2026-05-10 | `landing-pages/page.tsx` | **REFACTOR:** Botão Editar agora abre modal para dados, separado de Gerenciar |
| 2026-05-10 | `sites/[siteId]/pages/page.tsx` | **REFACTOR:** Separado Editar Dados (modal) de Abrir Construtor (rota) |
| 2026-05-10 | `landing-pages/[lpId]/pages/page.tsx` | **REFACTOR:** Separado Editar Dados (modal) de Abrir Construtor (rota) |
| 2026-05-10 | `EditProjectActions.tsx` | **NOVO:** Componente inline para edição rápida com useTransition (sem re-renders) |
| 2026-05-10 | `updateProfile.ts` | **EXPANDIDO:** Server Action atualizada para aceitar name, email, phone |
| 2026-05-10 | `changePassword.ts` | **NOVO:** Server Action para alteração de senha com validação OAuth |
| 2026-05-10 | `settings/page.tsx` | **NOVO:** Página de Configurações Gerais como Server Component |
| 2026-05-10 | `settings/settings.client.tsx` | **UX:** Validação de formulário e feedback visual com loading spinners |
| 2026-05-10 | `settings/settings.client.tsx` | **FEATURE:** Máscara de telefone automática (XX) XXXXX-XXXX |
| 2026-05-10 | `settings/settings.client.tsx` | **FIX:** Corrigida persistência de dados após F5 |
| 2026-05-10 | `settings/settings.client.tsx` | **EXPANDIDO:** Layout de painel de controle com múltiplas sessões |
| 2026-05-10 | `prisma/schema.prisma` | **UPDATE:** Adicionados campos name e phone ao modelo User |
| 2026-05-10 | `updateProfile.ts` | **FIX:** Corrigido salvamento de name, email, phone no banco |
| 2026-05-10 | `settings/settings.client.tsx` | **FEATURE:** Máscara de telefone automática (XX) XXXXX-XXXX |
| 2026-05-10 | `settings/settings.client.tsx` | **FIX:** Corrigida persistência de dados após F5 |
| 2026-05-10 | `settings/settings.client.tsx` | **SECURITY:** Validações robustas de senha (8 chars, maiúscula, número, especial) |
| 2026-05-10 | `changePassword.ts` | **IMPLEMENTED:** Lógica real de alteração de senha com bcrypt |
| 2026-05-10 | `settings/settings.client.tsx` | **FEATURE:** Tema escuro com persistência no banco e aplicação global |
| 2026-05-10 | `types/next-auth.d.ts` | **UPDATE:** Adicionado campo darkMode ao UserPreferences |
| 2026-05-10 | `settings/page.tsx` | **UPDATE:** Carrega preferências do usuário incluindo darkMode |
| 2026-05-10 | `CoreRenderer.tsx` | **FIX:** Corrigidos múltiplos erros de TypeScript em props do nó |
| 2026-05-10 | `tabs.tsx` | **NOVO:** Componente UI shadcn/ui para Tabs |
| 2026-05-10 | `card.tsx` | **NOVO:** Componente UI shadcn/ui para Cards |
| 2026-05-10 | `avatar.tsx` | **NOVO:** Componente UI shadcn/ui para Avatar |
| 2026-05-10 | `separator.tsx` | **NOVO:** Componente UI shadcn/ui para Separator |
| 2026-05-10 | `switch.tsx` | **NOVO:** Componente UI shadcn/ui para Switch |
| 2026-05-10 | `Sidebar.tsx` | **FEATURE:** Link Configurações adicionado com active link state |
| 2026-05-10 | `sites/page.tsx` | **UI:** Botões maiores com ícones ArrowRight (Gerenciar) e Settings (Editar) |
| 2026-05-10 | `landing-pages/page.tsx` | **UI:** Botões maiores com ícones ArrowRight (Gerenciar) e Settings (Editar) |
| 2026-05-10 | `EditProjectModal.tsx` | **FIX:** Removido para evitar re-renderização infinita em Server Components |
| 2026-05-10 | `BuilderWorkspace.tsx` | **NOVO:** Componente central compartilhado para edição de páginas (Sites e Landing Pages) |
| 2026-05-10 | `BuilderSkeleton.tsx` | **CENTRALIZADO:** Movido para /components/builder/ para uso compartilhado |
| 2026-05-10 | `useIsMounted.ts` | **CENTRALIZADO:** Movido para /components/builder/ para uso compartilhado |
| 2026-05-10 | `landing-pages/[lpId]/pages/[pageId]/builder/page.tsx` | **REFACTOR:** Server Component usando BuilderWorkspace com projectType="LANDING_PAGE" |
| 2026-05-10 | `sites/[siteId]/pages/[pageId]/builder/page.tsx` | **REFACTOR:** Server Component usando BuilderWorkspace com projectType="INSTITUTIONAL" |
| 2026-05-10 | `page.client.tsx` (obsoleto) | **REMOVIDO:** Lógica movida para BuilderWorkspace.tsx |
| 2026-05-10 | `BuilderSkeleton.tsx` (obsoleto) | **REMOVIDO:** Movido para /components/builder/ |
| 2026-05-10 | `useIsMounted.ts` (obsoleto) | **REMOVIDO:** Movido para /components/builder/ |
| 2026-05-10 | `uploadImage.ts` | **NOVO:** Server action para upload de imagens na BunnyCDN com validação |
| 2026-05-10 | `updateAvatar.ts` | **NOVO:** Server action para atualizar avatar do usuário com URL |
| 2026-05-10 | `getUserPreferences.ts` | **NOVO:** Server action para buscar preferências do usuário logado |
| 2026-05-10 | `update-avatar-modal.tsx` | **NOVO:** Modal com Dialog/Tabs para upload de avatar via arquivo ou URL |
| 2026-05-10 | `ThemeProvider.tsx` | **NOVO:** Provedor de tema para dashboard com preferências do usuário |
| 2026-05-10 | `GlobalThemeProvider.tsx` | **NOVO:** Provedor global de tema com sincronização periódica |
| 2026-05-10 | `layout.tsx` (app) | **FEATURE:** Script anti-flash para tema dark antes de renderização |
| 2026-05-10 | `layout.tsx` (dashboard) | **FEATURE:** ThemeProvider integrado com preferências do usuário |
| 2026-05-10 | `settings.client.tsx` | **FEATURE:** UpdateAvatarModal integrado substituindo botão antigo |
| 2026-05-10 | `uploadImage.ts` | **REFACTOR:** Converte imagens para .avif via sharp (quality: 80), suporta subpastas dinâmicas |
| 2026-05-10 | `update-avatar-modal.tsx` | **REFACTOR:** Atualizado para nova API do uploadImage com folder 'avatars' |
| 2026-05-10 | `sites/page.tsx` | **FIX:** Botão 'Novo Site' só renderiza quando projects.length > 0 (melhoria UX empty state) |
| 2026-05-10 | `landing-pages/page.tsx` | **FIX:** Botão 'Nova Landing Page' só renderiza quando projects.length > 0 (melhoria UX empty state) |
| 2026-05-10 | `schema.prisma` | **FEATURE:** Model Project recebe isActive, deletedBy, deletionReason para soft delete com auditoria |
| 2026-05-10 | `softDeleteProject.ts` | **NOVO:** Server Action de soft delete: inativa projeto, registra autor e motivo, revalida rotas |
| 2026-05-10 | `DeleteProjectModal.tsx` | **NOVO:** Modal de inativação com inputs de nome/motivo, validação e feedback via toast |
| 2026-05-10 | `getProjects.ts` | **FIX:** Filtro isActive: true adicionado — projetos inativos excluídos de todas as listagens |
| 2026-05-10 | `sites/page.tsx` | **FEATURE:** Botão Trash2 nos cards com DeleteProjectModal integrado |
| 2026-05-10 | `landing-pages/page.tsx` | **FEATURE:** Botão Trash2 nos cards com DeleteProjectModal integrado |
| 2026-05-10 | `DeleteProjectModal.tsx` | **FEATURE:** Checkbox de consentimento explícito obrigatório antes de habilitar exclusão |
| 2026-05-10 | `settings.client.tsx` | **FIX:** Removido campo Slug da aba Empresa nas configurações |
| 2026-05-10 | `globals.css` | **REFACTOR:** Paleta `.dark` harmonizada (warm tones) + variáveis shadcn (`--background`, `--card`, `--primary`, `--destructive`, etc.) mapeadas para tokens brand |
| 2026-05-10 | `tailwind.config.ts` | **REFACTOR:** Tokens shadcn (background, foreground, card, primary, secondary, muted, accent, destructive, border, input, ring) adicionados ao theme.extend.colors |
| 2026-05-10 | Global UI sweep | **REFACTOR:** Removidas cores hardcoded (`#161718`, `#514030`, `bg-white`, `bg-gray-*`, `text-blue-500`) de ~25 arquivos: Sidebar, ContextSidebar, dashboard pages, sites/landing-pages pages e sub-pages, settings, builder workspace/panels (Components, Properties, Canvas, RenderNode, LayerItem, VideoPlayer, LayoutForm, BuilderSkeleton), modais (Create/Edit/Delete Project, EditPage), LoginForm, Switch, ToastContainer. Substituídas por tokens semânticos `brand-*`/`sidebar-*`/`card`/`destructive` |
| 2026-05-10 | `layout.tsx` (root) | **FIX:** Removida `<script>` tag do `<head>` (incompatível com React render); script anti-flash agora via componente `ThemeScript` no body |
| 2026-05-10 | `ui-design` skill | **REFACTOR:** Adicionada DIRETRIZ DE CORES E DARK MODE (prioridade máxima) proibindo cores literais/hex e exigindo uso de tokens semânticos; checklist de validação dark mode incluído |
| 2026-05-10 | `Sidebar.tsx` | **FEATURE:** Logo dinâmica: `logo-min.svg` quando minimizada, `janus-logo.svg` expandida |
| 2026-05-10 | `Sidebar.tsx` | **UX:** Largura collapsed `64px → 80px`; links viram `flex-col` com label `text-[10px]` abaixo do ícone |
| 2026-05-10 | `Sidebar.tsx` | **UX:** Botão minimizar compacto (`w-8 h-8`); Bell e Settings usam `utilItemClasses` com hover semântico |
| 2026-05-10 | `Sidebar.tsx` | **UX:** Bloco de perfil no rodapé convertido em `<Link>` para `/settings` sem hover; avatar clicável em ambos os estados |
| 2026-05-10 | `Sidebar.tsx` | **REFACTOR:** `borderTop` do rodapé usa `var(--brand-btn-light)` (removido `rgba` hardcoded); funções `navItemClasses`/`utilItemClasses` extraídas |
| 2026-05-10 | `Sidebar.tsx` | **ARCH:** Context switching unificado — detecta `siteId`/`lpId` via `useParams`; quando em projeto exibe botão Voltar + itens Páginas/Resultados/Blog; fora exibe menu principal |
| 2026-05-10 | `[siteId]/layout.tsx` | **REFACTOR:** Removido `ContextSidebar` e wrapper div — apenas auth check + `<>{children}</>` |
| 2026-05-10 | `[lpId]/layout.tsx` | **REFACTOR:** Removido `ContextSidebar` e wrapper div — apenas auth check + `<>{children}</>` |
| 2026-05-10 | `ContextSidebar.tsx` | **DELETED:** Arquivo removido — lógica absorvida pela Sidebar principal (modelo drill-down/context switching) |
| 2026-05-11 | `schema.prisma` | **PIVOT Headless CMS:** `Page` ganha `schemaData` (estrutura JSON) e `contentData` (valores preenchidos); aplicado via `prisma db push` |
| 2026-05-11 | `_archived_builder/` | **ARCHIVED:** Pasta `src/components/builder` renomeada; excluída de `tsconfig.json` (junto com `hooks/use-builder.ts`) |
| 2026-05-11 | `SchemaBuilderEditor.tsx` | **NEW:** Cliente Monaco Editor (JSON, vs-dark/light dinâmico, minimap off, formatOnPaste, automaticLayout) com toolbar Voltar + Salvar |
| 2026-05-11 | `updatePageSchema.ts` | **NEW:** Server Action que valida JSON, autoriza por `companySlug` e persiste em `Page.schemaData`; revalida path da API pública |
| 2026-05-11 | `sites/[siteId]/.../builder/page.tsx` + `landing-pages/[lpId]/.../builder/page.tsx` | **REPLACED:** Renderizam `<SchemaBuilderEditor />` em vez de `<BuilderWorkspace />`; `page.client.tsx`/`BuilderSkeleton.tsx`/`useIsMounted.ts` órfãos removidos |
| 2026-05-11 | `api/v1/content/[companySlug]/[pageSlug]/route.ts` | **NEW:** Endpoint público GET (CORS `*`, OPTIONS); retorna `{ slug, name, schema, content, updatedAt }` apenas para páginas publicadas; cache 60s |
| 2026-05-11 | `sites/.../edit/page.tsx` + `landing-pages/.../edit/page.tsx` | **NEW:** Página "Editar Conteúdo" com arquitetura Split-Pane (Esquerda: Formulário w-1/3; Direita: Preview w-2/3) |
| 2026-05-11 | `IframePreview.tsx` | **NEW:** Componente de preview via iframe para a tela de edição, com toggle responsivo Desktop/Mobile. Fallback state se não houver URL |
| 2026-05-11 | `sites/[siteId]/pages/page.tsx` + `landing-pages/[lpId]/pages/page.tsx` | **UX:** Botões atualizados para "Configurações" (Modal), "Construir" (Schema Editor) e "Editar" (Content Split-Pane) |
| 2026-05-11 | `schema.prisma` | **DB:** Adicionado campo `previewUrl` (String?) em `Project` para linkar o host real do iframe do cliente |
| 2026-05-11 | `EditProjectModal.tsx` + `updateProject.ts` | **FEAT:** Adicionado campo `URL de Preview do Site` nas configurações do projeto para salvar o endpoint renderizador |
| 2026-05-11 | `DynamicForm.tsx` + `updatePageContentData.ts` | **NEW:** Formulário dinâmico que lê o json `schemaData` e renderiza Inputs/Textareas. Salva dados no `contentData` (server action) |
| 2026-05-11 | `SchemaBuilderEditor.tsx` | **UX:** Inclusão de Info Bar ("Endpoint da API Pública") com copy to clipboard para instruir o desenvolvedor |
| 2026-05-11 | `CreatePageModal.tsx` + `createPage.ts` | **NEW:** Modal de criação de página com nome e slug (auto-gerado); validação de slug único por projeto; revalida listagem |
| 2026-05-11 | `PublishPageButton.tsx` + `togglePagePublish.ts` | **NEW:** Botão Publicar/Despublicar com toggle visual e server action para expor página na API pública |
| 2026-05-11 | `SchemaBuilderEditor.tsx` + `LiveFormPreview.tsx` + `DynamicForm.tsx` + `uploadMedia.ts` | **FEAT:** Ajustes finais UX — (1) Aba Estrutura: ícone Layers + Trash2 hover-only por seção; `handleDeleteSection` filtra JSON no Monaco sem re-render; `handleFocusSection` scrollIntoView + ring highlight 1s sincronizando Painel Esq ↔ Painel Dir; (2) LiveFormPreview: `id="section-{key}"` em cada card + ring animado quando focado; (3) DynamicForm: campos `image` e `video` usam uploader CDN BunnyCDN via `uploadMedia` (imagem→AVIF, vídeo→raw); loading state por campo; Salvar bloqueado durante uploads; (4) `uploadMedia.ts`: suporte a image + video com validação de tamanho |
| 2026-05-11 | `SchemaBuilderEditor.tsx` + `LiveFormPreview.tsx` | **FEAT:** Workspace Headless 3 painéis — Esquerda: índice de seções reativo; Centro: Monaco + toolbar Endpoint + dropdown Snippets (Hero, Features, SEO) com insert sem resetar cursor; Direita: preview read-only do formulário com badge por tipo de campo; badge "JSON Inválido" sutil; `SNIPPETS` e `DEFAULT_SCHEMA` usam novo formato `[{ id, name, fields[] }]` |
| 2026-05-11 | `EditPageContainer.tsx` + `EditPageModal.tsx` | **FIX:** Padrão Container/Modal com `key` incremental para forçar re-mount; corrige `name="slug"` no input (antes `pageSlug` que não lia na action); `useEffect` para fechar modal após sucesso; aviso sobre slug alterar URL da API |
| 2026-05-11 | `EditProjectContainer.tsx` | **FIX:** Adicionado `key` incremental para forçar re-mount do `EditProjectModal`, garantindo `defaultValue` atualizado ao reabrir |
| 2026-05-11 | `ui/toast-container.tsx` | **MOVED:** Extraído de `_archived_builder` (substitui `text-white` por `text-brand-btn-light`); imports atualizados em `DeleteProjectModal.tsx` e `settings.client.tsx` |
| 2026-05-12 | `SchemaBuilderEditor.tsx` + builder pages | **FEAT:** Botão Publicar (`PublishPageButton`) no topo ao lado do Salvar; botão Visualizar redireciona para tela de edição (split-pane) em nova aba; ordem: Publicar → Salvar → Visualizar |
| 2026-05-12 | `SchemaBuilderEditor.tsx` | **FEAT:** `insertSnippet` adiciona campo `active` (type: boolean) automaticamente no início de toda nova seção inserida via snippet; permite ativar/desativar seções no formulário de edição |
| 2026-05-12 | `SchemaBuilderEditor.tsx` | **UX:** Ícone `Library` adicionado à aba "Componentes" no painel esquerdo |
| 2026-05-12 | `IframePreview.tsx` | **FEAT:** Botão Tablet (`Tablet` icon) entre Desktop e Mobile; dimensões tablet: 768px width, rounded-3xl, shadow-2xl |
| 2026-05-12 | `DynamicForm.tsx` + `LiveFormPreview.tsx` | **FEAT:** Tipo `list` dinâmico — cards expansíveis com sub-campos (`itemFields`: image, text, textarea, boolean); botões "Adicionar" e "Remover" por item; upload CDN funciona dentro de itens de lista |
| 2026-05-12 | `SchemaBuilderEditor.tsx` (snippets) | **UPDATE:** Hero snippet expandido com 11 campos (video, url, color, boolean, number, select, html); Carrossel usa `type: 'list'` com `itemFields: [image, caption]` para quantidade ilimitada de slides |
| 2026-05-12 | `dashboard/layout.tsx` + `globals.css` + edit pages | **FIX:** Body `overflow: hidden` + `html/body height: 100%` no globals.css; dashboard container `h-screen`; edit pages e SchemaBuilderEditor usam `h-full` em vez de `calc(100vh-...)`; elimina scroll duplo |
| 2026-05-12 | `uploadMedia.ts` | **NEW:** Server Action genérica para upload de mídia (image→AVIF via Sharp, video→raw); BunnyCDN; validação de tamanho e tipo |
| 2026-05-13 | `src/components/dashboard/MobileNav.tsx` | **NEW:** Drawer mobile (`flex md:hidden`) com Topbar + hamburger; aceita qualquer Sidebar como children; backdrop + slide-in animation; trava scroll do body quando aberto |
| 2026-05-13 | `Sidebar.tsx` + `AdminSidebar.tsx` + `DevSidebar.tsx` + `GuestSidebar.tsx` | **FEAT:** Prop `embedded` adicionada — sidebar fixa esconde-se com `hidden md:flex`; quando `embedded` renderiza em fluxo (sem position: fixed) para uso dentro do MobileNav |
| 2026-05-13 | `dashboard/layout.tsx` + `dashboard-admin/layout.tsx` + `dev/.../layout.tsx` + `guest/layout.tsx` | **FEAT:** Layouts agora renderizam Sidebar normal + `<MobileNav>` com Sidebar embedded; `<main>` usa `pt-14 md:pt-0 md:ml-[var(--sidebar-width,220px)] overflow-x-hidden` |
| 2026-05-13 | `ui/dialog.tsx` | **FEAT:** `DialogContent` base agora aplica responsividade automática: `w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-4 sm:p-6` |
| 2026-05-13 | Modais custom (`CreatePageModal`, `EditPageModal`, `CreateProjectModal`, `EditProjectModal`, `DeleteProjectModal`, `CreateCompanyModal`) | **FEAT:** Padronização responsiva: `w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6` |
| 2026-05-13 | `sites/page.tsx` + `landing-pages/page.tsx` + `GuestGalleryClient.tsx` + `dashboard-admin/page.tsx` + `dashboard/page.tsx` | **FEAT:** Grids progressivos `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6` (cards) e `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (métricas admin) |
| 2026-05-13 | 9 tabelas CRUD (AdminUsers, AdminCompanies, AdminDevelopers, AdminLogs (2), DevCompanies, DevUsers, CompaniesTable, BlogCategories, BlogPosts, BlogTags) | **FEAT:** Cada `<table>` envolvida em `<div className="w-full overflow-x-auto">` + `min-w-[600/720px]` para evitar overflow horizontal no mobile |
| 2026-05-13 | `SchemaBuilderEditor.tsx` | **FEAT:** Split-pane responsivo — `flex flex-col lg:flex-row`; sidebars laterais `w-full lg:w-72`/`lg:w-[360px]` com bordas adaptativas; Monaco editor central `min-h-[400px] lg:min-h-0`; header `flex-col sm:flex-row` |
| 2026-05-13 | `sites/.../edit/page.tsx` + `landing-pages/.../edit/page.tsx` | **FEAT:** Edit page split-pane empilha mobile: form `w-full lg:w-1/3`, iframe preview `w-full lg:w-2/3 min-h-[60vh]` |
| 2026-05-13 | `.windsurf/skills/ui-design/SKILL.md` + `.claude/skills/ui-design.md` | **DOCS:** Seção "Padrões de Responsividade" obrigatória + 7 novos itens no checklist (sidebar drawer, grids progressivos, modais 95vw, tabelas overflow-x, split-pane flex-col, touch targets ≥ 40px, breakpoints sm/md/lg/xl) |
| 2026-05-14 | `src/app/layout.tsx` | **FEAT:** title "Janus", description da aplicação, favicon dinâmico via metadata.icons com media queries (light/dark) |
| 2026-05-14 | `src/components/ThemeScript.tsx` | **FEAT:** Atualiza favicon dinamicamente via MutationObserver ao detectar mudança da classe `dark` |
| 2026-05-14 | `src/components/GlobalThemeProvider.tsx` | **FEAT:** Troca favicon junto com o tema (favicon.png claro / favicon-white.png escuro) |
| 2026-05-14 | `src/components/dashboard/Sidebar.tsx` | **FEAT:** Logo alterna dinamicamente: janus-logo-white.svg + janus-logo-min-white.svg no dark mode |
| 2026-05-14 | `src/components/admin/AdminSidebar.tsx` | **FEAT:** Logo alterna dinamicamente no dark mode (mesmas imagens white) |
| 2026-05-14 | `src/components/dev/DevSidebar.tsx` | **FEAT:** Logo alterna dinamicamente no dark mode (mesmas imagens white) |
| 2026-05-14 | `sites/[siteId]/pages/page.tsx` + `landing-pages/[lpId]/pages/page.tsx` | **RBAC:** Botões Nova Página, Construir, Configurações ocultos para USER/ADMIN (visão user); só DEVELOPER vê ferramentas de estrutura |
| 2026-05-14 | `sites/.../builder/page.tsx` + `landing-pages/.../builder/page.tsx` | **RBAC:** Redirect server-side para lista de páginas se role !== DEVELOPER |
| 2026-05-14 | `createPage.ts` + `updatePage.ts` + `updatePageSchema.ts` | **RBAC:** Bloqueio para role !== DEVELOPER; removido bypass ADMIN (ADMIN em user view = permissões de USER) |
| 2026-05-14 | `src/modules/dev/queries/getDevStats.ts` | **NOVO:** Contagens paralelas para Dev Dashboard (totalCompanies, totalUsers, totalProjects filtrados por createdById) |
| 2026-05-14 | `src/modules/dev/queries/getRecentProjects.ts` | **NOVO:** Últimos 5 projetos atualizados das empresas do dev |
| 2026-05-14 | `src/app/dev/[devId]/dashboard/page.tsx` | **REFACTOR:** Layout Centro de Comando — 4 top cards + grid 3 colunas (projetos, empresas, usuários) + formatRelative helper |
| 2026-05-14 | `prisma/schema.prisma` | **FEAT:** onDelete: Cascade adicionado em GuestEntry.company, User.company, Project.company, Page.project, ProjectHistory.project/user |
| 2026-05-14 | `src/components/ui/alert-dialog.tsx` | **NOVO:** Componente AlertDialog baseado em @radix-ui/react-alert-dialog (overlay, content, header, footer, action, cancel) |
| 2026-05-14 | `src/components/ui/delete-alert-modal.tsx` | **NOVO:** Modal reutilizável de confirmação de exclusão com botões "Não, cancelar" (outline) e "Sim, excluir" (destructive) |
| 2026-05-14 | `src/modules/admin/actions/adminDeleteCompany.ts` | **BREAKING:** Alterado de soft delete para hard delete (`company.delete`); cascade apaga tudo automaticamente |
| 2026-05-14 | `src/modules/admin/actions/adminDeleteUser.ts` | **NOVO:** Hard delete de usuário (DEFAULT, ADMIN ou DEVELOPER); verifica role ADMIN; revalida rotas users + developers |
| 2026-05-14 | `src/app/dashboard-admin/companies/AdminCompaniesClient.tsx` | **FEAT:** DeleteDialog inline substituído por DeleteAlertModal reutilizável; router.refresh() após exclusão |
| 2026-05-14 | `src/app/dashboard-admin/users/AdminUsersClient.tsx` | **FEAT:** Coluna Ações com botão Trash2 + DeleteAlertModal; router.refresh() após exclusão |
| 2026-05-14 | `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx` | **FEAT:** Botão Trash2 ao lado de LayoutDashboard + DeleteAlertModal; router.refresh() após exclusão |
| 2026-05-14 | `src/app/[companySlug]/preview/[pageId]/page.tsx` | **FIX:** Adicionado check `isAdmin` para permitir admins visualizarem páginas não publicadas de qualquer empresa (God Mode) |
| 2026-05-14 | `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx` | **FIX:** Alterado `<a>` para `<Link>` no botão "Acessar Painel Dev" para melhor navegação client-side |
| 2026-05-14 | `src/app/[companySlug]/guest/layout.tsx` | **FIX:** Adicionado `md:overflow-y-auto` no main para scrolling adequado em desktop no contexto guest |
| 2026-05-14 | `src/components/guest/GuestSidebar.tsx` | **FIX:** Removido `display: flex` do style inline quando não embedded; adicionado `flex flex-col` ao className para permitir classe `hidden md:flex` funcionar corretamente no mobile |
| 2026-05-14 | `src/components/guest/GuestSidebar.tsx` | **FIX:** Adicionado MutationObserver para monitorar dark mode; logo alterna para `janus-logo-white.svg` no dark mode |
| 2026-05-14 | `src/components/dashboard/MobileNav.tsx` | **FIX:** Adicionado MutationObserver para monitorar dark mode; logo alterna para `janus-logo-white.svg` no dark mode |
| 2026-05-14 | `next.config.ts` | **FEAT:** Adicionado `serverActions.bodySizeLimit: '100mb'` para aceitar uploads pesados de imagens |
| 2026-05-14 | `src/modules/upload/actions/uploadImage.ts` | **FEAT:** Removido limite de tamanho de arquivo (maxSize 5MB); permite qualquer tamanho de imagem |
| 2026-05-14 | `src/modules/upload/actions/uploadMedia.ts` | **FEAT:** Removido limite de tamanho de arquivo (maxSize 200MB vídeo, 5MB imagem); permite qualquer tamanho |
| 2026-05-14 | `src/components/users/update-avatar-modal.tsx` | **FEAT:** Removido limite de tamanho de arquivo (maxSize 5MB) para avatares |
| 2026-05-14 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FEAT:** Adicionado feedback visual "Enviando imagem para a nuvem..." durante upload; botão desabilitado até conclusão |
| 2026-05-14 | `src/app/[companySlug]/guest/EditPostModal.tsx` | **FEAT:** Desabilitados campos de input enquanto a ação está em progresso para melhor UX |
| 2026-05-15 | `package.json` | **DEP:** Adicionado `browser-image-compression` (2.0.2) para compressão client-side de imagens |
| 2026-05-15 | `prisma/schema.prisma` | **FEAT:** Adicionado campo `mediaType` String @default("IMAGE") ao model GuestPost |
| 2026-05-15 | `prisma/migrations/20260515024918_add_media_type_to_guest_posts` | **MIGRATION:** Adiciona coluna mediaType ao guest_posts com default 'IMAGE' |
| 2026-05-15 | `src/app/api/upload/route.ts` | **NEW:** API Route handler para upload otimizado — aceita imagem ou vídeo via FormData; comprime imagens em buffer antes de enviar BunnyCDN; retorna { url, mediaType } |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **REFACTOR:** Componente completamente refatorado com suporte a iPhones (HEIC/HEIF/MOV) — reordenação: upload de mídia PRIMEIRO (mobile-first) + título + mensagem; file input aceita `image/*, video/*, .heic, .heif, .mov, .mp4, .webm` |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FEAT:** Compressão client-side via browser-image-compression — imagens: maxSizeMB=1, maxWidthOrHeight=1920, useWebWorker=true; vídeos: sem compressão; estado `isCompressing` com spinner "Otimizando mídia..." |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FEAT:** Upload via API Route em vez de Server Action — FormData com arquivo comprimido + mediaType; bloqueio de campos até conclusão; preview dinâmico <video> para vídeos, <Image> para imagens |
| 2026-05-15 | `src/modules/guests/actions/createGuestPost.ts` | **REFACTOR:** Action refatorada para aceitar imageUrl e mediaType via hidden inputs (upload feito no frontend); remove dependency de uploadImage Server Action |
| 2026-05-15 | `src/app/[companySlug]/guest/GuestGalleryClient.tsx` | **FEAT:** Adicionado suporte a vídeos — renderização condicional <video controls> se mediaType===VIDEO, <Image> caso contrário; labels atualizadas "Mídia" em vez de "Foto" |
| 2026-05-15 | `src/app/dashboard-admin/guests/[guestId]/posts/AdminGuestPostsClient.tsx` | **FEAT:** Adicionado suporte a vídeos no painel admin — interface Post inclui mediaType; PostCard renderiza <video> ou <img> condicionalmente |
| 2026-05-15 | `src/app/[companySlug]/guest/page.tsx` | **FIX:** Mapeamento de posts agora inclui `mediaType: p.mediaType || 'IMAGE'` para compatibilidade com dados antigos |
| 2026-05-15 | `src/app/dashboard-admin/guests/[guestId]/posts/page.tsx` | **FIX:** Select Prisma agora inclui `mediaType: true` ao buscar posts |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **REFACTOR:** Removido estado `isCompressing` (silencioso); adicionado rastreamento de progresso via XMLHttpRequest |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **UX:** Barra de progresso visual com porcentagem (0-100%) durante upload; feedback em tempo real `{uploadProgress}%` |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **PERF:** Compressão silenciosa (client-side, não exibe ao usuário); apenas upload exibe progresso |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **UX:** Adicionado estado "Processando arquivo..." quando atinge 100% (indica processamento servidor) com spinner |
| 2026-05-15 | `src/app/api/upload/route.ts` | **PERF:** Otimização AVIF — reduzido quality de 80 para 70; effort de 6 para 4 (3x mais rápido, qualidade visual similar) |
| 2026-05-15 | `src/app/api/upload/route.ts` | **PERF:** Adicionado timeout 30s para BunnyCDN; abort automático em caso de lentidão extrema |
| 2026-05-15 | `src/app/api/upload/route.ts` | **FIX:** Adicionado `limitInputPixels: false` para processar imagens muito grandes sem erro |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **REFACTOR:** Removido browser-image-compression — arquivo enviado exatamente como o usuário seleciona (sem compressão) |
| 2026-05-15 | `src/app/api/upload/route.ts` | **REFACTOR:** Removido processamento AVIF — arquivo enviado direto para BunnyCDN mantendo formato original (JPEG, PNG, HEIC, MOV, MP4, etc) |
| 2026-05-15 | `src/app/api/upload/route.ts` | **SIMPLIFY:** Extension e Content-Type extraídos do arquivo original; sem conversão ou minificação |
| 2026-05-15 | `package.json` | **DEP:** Removido `browser-image-compression` (2.0.2) — upload sem compressão client-side |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **UX:** Input file abre INSTANTANEAMENTE ao clicar (sem delay); preview mostrado imediatamente; upload acontece APENAS no submit do formulário |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **PERF:** Arquivo armazenado em `selectedFileRef` até envio; loading com barra de progresso exibido apenas durante submit |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **STATE:** Removido `uploadedUrl` e `uploadedMediaType` como estado; adicionados via FormData no handleSubmit |
| 2026-05-15 | `next.config.ts` | **FIX:** Removido `serverActions` config (não suportado em Next.js 16); body size limit gerenciado no API route com AbortController |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FIX:** Corrigido FormData usando `formRef.current` em vez de `e.currentTarget` no handleSubmit |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FIX:** Adicionado `useTransition` e envolvido `formAction` em `startTransition` para respeitar hooks do React 19 |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FIX:** Adicionado `DialogDescription` vazio para resolver aviso de acessibilidade do Radix UI |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FIX:** Adicionado atributo `required` no textarea para forçar preenchimento (validação nativa HTML) |
| 2026-05-15 | `src/modules/guests/actions/createGuestPost.ts` | **FIX:** Mensagem de erro detalhada mostrando todos os campos que falharam validação |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **FIX:** Pegando valores de title/message direto do DOM (não FormData) porque campos desabilitados não entram no FormData |
| 2026-05-15 | `src/app/api/upload/route.ts` | **PERF:** Aumentado timeout de 30s → 300s (5 min) para suportar uploads grandes (200MB+) |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **PERF:** Adicionado `xhr.timeout = 600000` (10 min) no XMLHttpRequest para uploads longos |
| 2026-05-15 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **UX:** Adicionado handler de timeout no XHR com mensagem clara "Upload expirou (timeout)" |
| 2026-05-15 | `src/app/api/upload/route.ts` | **UX:** Mensagem de erro diferenciada para 504 (timeout) vs outros erros |
| 2026-05-16 | `src/app/[companySlug]/guest/NewPostModal.tsx` | **REFACTOR:** Removido campo Título do form de nova postagem (UI + DOM read + import do Input) |
| 2026-05-16 | `src/modules/guests/actions/createGuestPost.ts` | **REFACTOR:** Removido título do schema Zod e do `db.guestPost.create` |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` | **FIX:** RBAC — corrigida verificação `isDevOrAdmin` para incluir ADMIN (`['DEVELOPER','ADMIN'].includes(role)`) |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/builder/page.tsx` | **FIX:** RBAC — redirect agora permite passagem de ADMIN além de DEVELOPER |
| 2026-05-16 | `prisma/schema.prisma` | **FEAT:** Adicionado campo `permissions String[]` no model User (RBAC granular) |
| 2026-05-16 | `src/lib/auth/permissions.ts` | **FEAT:** Criadas constantes PERMISSIONS, ALL_PERMISSIONS, VIEW_MODE_* e utilitário `checkPermission` (suporta cookie `janus_view_mode` para impersonation de usuário) |
| 2026-05-16 | `src/modules/auth/actions/toggleViewMode.ts` | **FEAT:** Server Action que seta/limpa cookie HTTP-Only `janus_view_mode` (USER_MODE/DEV_MODE) e revalida o layout do tenant |
| 2026-05-16 | `src/modules/admin/actions/updateUserPermissions.ts` | **FEAT:** Server Action que atualiza array `permissions` de um usuário (validada via Zod, restrita a ADMIN) |
| 2026-05-16 | `src/modules/admin/actions/createDeveloper.ts` | **FEAT:** DEVELOPER recém-criado recebe `permissions: ALL_PERMISSIONS` por padrão |
| 2026-05-16 | `src/modules/admin/actions/adminCreateUser.ts` | **FEAT:** ADMIN recebe `ALL_PERMISSIONS`; DEFAULT recebe array vazio |
| 2026-05-16 | `src/modules/dev/actions/createUser.ts` | **FEAT:** DEFAULT criado por DEVELOPER recebe `permissions: []` por padrão |
| 2026-05-16 | `src/lib/auth.ts` | **FEAT:** `authorize` retorna `permissions` do usuário do banco |
| 2026-05-16 | `src/lib/auth.config.ts` | **FEAT:** JWT/session callbacks incluem `permissions`; suporte a `trigger: 'update'` para refresh da sessão |
| 2026-05-16 | `src/types/next-auth.d.ts` | **FEAT:** Tipagem da Session/JWT estendida com campo `permissions: string[]` |
| 2026-05-16 | `src/components/dashboard/ImpersonationBanner.tsx` | **FEAT:** Banner sticky com Switch "Simular Visão do Usuário" para ADMIN e DEVELOPER (chama toggleViewMode + router.refresh) |
| 2026-05-16 | `src/app/[companySlug]/dashboard/layout.tsx` | **REFACTOR:** Banner inline substituído por `<ImpersonationBanner>`; agora aparece para ADMIN e DEVELOPER; usa `isPrivilegedRole()` |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` | **REFACTOR:** Substituída checagem de role por `checkPermission(session, 'PAGE_CREATE'/'PAGE_BUILD'/'PAGE_DELETE')` |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/page.tsx` | **REFACTOR:** Mesma migração para `checkPermission` na rota antiga landing-pages |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/builder/page.tsx` | **REFACTOR:** Guard agora usa `checkPermission(session, 'PAGE_BUILD')` |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/builder/page.tsx` | **REFACTOR:** Mesmo guard via `checkPermission` na rota antiga |
| 2026-05-16 | `src/app/dashboard-admin/PermissionsModal.tsx` | **FEAT:** Modal com lista de Switches por permissão; salva via `updateUserPermissions` |
| 2026-05-16 | `src/app/dashboard-admin/developers/AdminDevelopersClient.tsx` | **FEAT:** Botão "Permissões" (ícone KeyRound) que abre PermissionsModal |
| 2026-05-16 | `src/app/dashboard-admin/users/AdminUsersClient.tsx` | **FEAT:** Botão "Permissões" (ícone KeyRound) que abre PermissionsModal |
| 2026-05-16 | `src/modules/admin/queries/getAdminDevelopers.ts` | **FEAT:** Select inclui `permissions: true` |
| 2026-05-16 | `src/modules/admin/queries/getAdminUsers.ts` | **FEAT:** Select inclui `permissions: true` |
| 2026-05-16 | `src/components/projects/EditProjectModal.tsx` | **REFACTOR:** Removido toggle "Módulo de Blog" — blog agora sempre ativo para todos os projetos (LANDING_PAGE e INSTITUTIONAL) |
| 2026-05-16 | `src/components/projects/EditProjectContainer.tsx` | **REFACTOR:** Removido prop `initialBlogEnabled` — EditProjectModal não mais aceita/passa esta propriedade |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/page.tsx` | **REFACTOR:** EditProjectContainer chamada simplificada (removido `initialBlogEnabled={project.blogEnabled}`) |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/page.tsx` | **REFACTOR:** EditProjectContainer chamada simplificada (removido `initialBlogEnabled={project.blogEnabled}`) |
| 2026-05-16 | `src/components/dashboard/Sidebar.tsx` | **REFACTOR:** Removida fetch ao `/api/projects/{id}/blog-enabled`; blog items (Artigos, Categorias, Tags) sempre renderizadas quando em projeto (sites/landing-pages) |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/blog/categories/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/categories/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/blog/tags/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/tags/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/sites/[siteId]/blog/posts/new/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/posts/new/page.tsx` | **REFACTOR:** Removido check `blogEnabled` — valida apenas se projeto existe |
| 2026-05-16 | `src/app/dev/[devId]/dashboard/companies/CompaniesClient.tsx` | **REFACTOR:** Removido botão "Gerenciar Blog" (ícone BookOpen) e ProjectsBlogModal do painel de desenvolvedor |
| 2026-05-16 | Blog Module Architecture | **REFACTOR:** Blog agora é sempre ativo para todos os Sites e Landing Pages; removida a configuração granular por projeto — simplifica UX e arquitetura |
| 2026-05-17 | `src/modules/auth/actions/toggleViewMode.ts` | **FIX:** Removido deletion de `IMPERSONATED_USER_ID_COOKIE` ao exiting USER_MODE — permite toggle back mantendo impersonated user |
| 2026-05-17 | `src/components/ui/toast-container.tsx` | **FIX:** Aumentado z-index para 99999 (inline style); adicionado prop `inModal` para posicionamento relativo em modais |
| 2026-05-17 | `src/components/dashboard/UserPermissionsModal.tsx` | **REFACTOR:** ToastContainer renderizado fora do Dialog com `position: fixed` e z-index alto para aparecer acima do modal |
| 2026-05-17 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` | **REFACTOR:** Removido `{canBuild &&}` do botão "Editar" (conteúdo) — qualquer usuário logado pode editar; botão "Configurações" agora requer `canBuild` |
| 2026-05-17 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/page.tsx` | **REFACTOR:** Mesma mudança do pages/page.tsx de sites — "Editar" sempre visível, "Configurações" requer `PAGE_BUILD` |
| 2026-05-17 | `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/edit/page.tsx` | **REFACTOR:** Removida verificação `PAGE_BUILD` — qualquer usuário logado pode editar conteúdo/valores do schema |
| 2026-05-17 | `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/edit/page.tsx` | **REFACTOR:** Removida verificação `PAGE_BUILD` — qualquer usuário logado pode editar conteúdo/valores do schema |
| 2026-05-17 | `src/app/dashboard-admin/PermissionsModal.tsx` | **FIX:** Adicionado cleaning de colons extras (`.replace(/^:+|:+$/g, '')`) na função `normalizePermissions()` — corrige parsing de landing pages permissions malformadas |
| 2026-05-17 | `src/modules/auth/actions/viewAsUser.ts` | **FIX:** Adicionado parâmetro opcional `redirectUrl` — permite permanecer na página atual ao alternar de DEV_MODE para USER_MODE |
| 2026-05-17 | `src/components/dashboard/ImpersonationBanner.tsx` | **FIX:** `handleUserToggle` passa `pathname` para `viewAsUser` — mantém contexto de página ao ativar USER_MODE |
| 2026-05-18 | `src/components/schema-builder/SchemaBuilderEditor.tsx` | **FEAT:** Switch "Modo Avançado (JSON Livre)" que oculta sidebars (Estrutura/Componentes/Preview) e exibe Monaco em fullwidth |
| 2026-05-18 | `src/components/schema-builder/DynamicForm.tsx` | **FEAT:** `normalizeSchema` aceita formato objeto `{ section: { field: {type,label} } }` além do array legado; novo tipo `group` renderizado como Card colapsável (GroupRenderer); aliases de tipo (string→text, bool→boolean); callback `onChange` para sync externo |
| 2026-05-18 | `src/components/schema-builder/IframePreview.tsx` | **FEAT:** Convertido para `forwardRef<HTMLIFrameElement>` — permite postMessage do parent |
| 2026-05-18 | `src/components/schema-builder/SiteContentEditClient.tsx` | **FEAT:** Sincronização live com iframe via `postMessage({ type: 'janus:content-update', pageId, contentData })` com debounce de 400ms |
| 2026-05-19 | `CLAUDE.md` | **DOCS:** Preferência por `pnpm` em vez de `npm` em todos os comandos; regra de registry skill obrigatória ao final de cada tarefa |
| 2026-05-19 | `.claude/context/cms/` | **ORG:** Documentação CMS centralizada em `.claude/context/cms/` (movida de `.claude/cms/`); todas as referências atualizadas em README.md, checklist.md, e CLAUDE.md |
| 2026-05-19 | `.claude/context/cms/changelog.md` | **DOCS:** Adicionadas entries sobre reorganização de CMS e preferência por pnpm |
| 2026-05-19 | `.claude/skills/module-docs.md` | **NEW:** Skill que documenta módulos automaticamente em `.claude/context/[modulo]/` economizando 50-100KB tokens |
| 2026-05-19 | `.claude/SKILLS.md` | **NEW:** Índice de skills disponíveis com modo de uso e quando aplicar |
| 2026-05-19 | `CLAUDE.md` | **DOCS:** Adicionada seção "Skills Obrigatórias e Recomendadas" mencionando module-docs |
| 2026-05-19 | `.claude/skills/README.md` | **NEW:** Índice centralizado de skills com tabela de referência rápida |
| 2026-05-19 | `.claude/INDEX.md` | **NEW:** Hub central de documentação apontando para context, skills, quick-ref com economia de tokens |
| 2026-05-19 | `src/app/.../edit/page.tsx` (sites e landing-pages) | **FEAT:** Adicionado `slug` + `apiEndpoint` gerado e passado para SiteContentEditClient |
| 2026-05-19 | `SchemaBuilderEditor.tsx` | **FEAT:** Endpoint bar em modo avançado (topo, igual legado); responsividade mobile melhorada em formulários |
| 2026-05-19 | `AdvancedJsonEditor.tsx` | **FIX:** Removido apiEndpoint (era só no edit, não era necessário) |
| 2026-05-19 | `SiteContentEditClient.tsx` | **FIX:** Removido apiEndpoint (edit não deve mostrar endpoint) |
| 2026-05-19 | Edit pages (sites/landing-pages) | **FIX:** Removido apiEndpoint, simplificado select (sem slug) |

---

## ⚠️ Notas de Ambiente

**Node.js Versão:** Requer Node.js 18+ (suporte a ES2021 para operador `??=` usado por Next.js 16)
- Desenvolvimento atual com Node.js v14.21.3 causará erro de build
- Atualize para Node.js 18 LTS ou superior antes de fazer build/deploy

**Multi-Tenant Architecture (desde 2026-05-09):**
- Todas as rotas protegidas agora usam `/{companySlug}/dashboard`
- Usuários não autenticados são redirecionados para `/login`
- Após autenticação, usuários são redirecionados para `/{companySlug}/dashboard` (companySlug extraído do JWT)
- Middleware valida se usuário está acessando a empresa correta; redireciona automaticamente caso contrário
- Uma empresa padrão (`default`) é criada na primeira migration; usuários registrados são associados a ela por padrão

**Sistema RBAC Híbrido + View Mode (desde 2026-05-16):**
- Roles: `ADMIN | DEFAULT | DEVELOPER` (enum `UserRole` no Prisma)
- Permissões granulares: `PAGE_CREATE | PAGE_DELETE | PAGE_BUILD | BLOG_MANAGE | GUEST_MANAGE | TEAM_MANAGE` (`User.permissions String[]`)
- Utilitário central: `src/lib/auth/permissions.ts` — `checkPermission(session, name)` lê cookie `janus_view_mode` automaticamente
- **Regra mestra:** ADMIN/DEVELOPER → true sempre (exceto se `janus_view_mode === 'USER_MODE'`, daí valida só `session.user.permissions`); DEFAULT → valida sempre o array de permissões
- **View Mode (Impersonation):** ADMIN e DEVELOPER têm Switch "Simular Visão do Usuário" no banner do tenant; cookie `janus_view_mode` (HTTP-Only) controla; toggle revalida o layout
- **Defaults na criação:** ADMIN/DEVELOPER → `ALL_PERMISSIONS`; DEFAULT → `[]`
- **Gerenciamento:** Admin pode editar permissões de cada usuário/dev via ícone KeyRound → `PermissionsModal` → action `updateUserPermissions`

**Blog Module Architecture (desde 2026-05-16):**
- Blog **não é mais configurável por projeto** — remova toggles/modais (`EditProjectModal`, `ProjectsBlogModal`)
- Blog é **sempre ativo** para todos os Sites (INSTITUTIONAL) e Landing Pages (LANDING_PAGE)
- Remova checks `blogEnabled` de todas as rotas blog; valide apenas se projeto existe
- Sidebar **sempre exibe** Artigos/Categorias/Tags quando dentro de projeto (sites/landing-pages)
- Benefício: reduz complexidade, melhora UX (menos decisões), alinha com expectativa de que blogs são core feature
- **Redirects pós-login:** ADMIN → `/dashboard-admin`; DEVELOPER → `/dev/{id}/dashboard`; DEFAULT → `/{companySlug}/dashboard` (gerenciado em `src/lib/auth.config.ts`)
