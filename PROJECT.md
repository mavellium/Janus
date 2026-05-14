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
- **Entidade:** `src/modules/users/domain/User.ts` — usuário com role DEFAULT/ADMIN, normaliza email, valida hash; **Novo:** agora inclui `companyId` obrigatório
- **Erros:** `src/modules/users/domain/errors.ts` — INVALID_EMAIL, INVALID_PASSWORD, EMAIL_ALREADY_EXISTS, INVALID_CREDENTIALS
- **Actions:** `registerUser.ts` — cria usuário com bcrypt hash e `companyId` = default company | `signInAction.ts` — form action para Auth.js (useActionState) | `updatePreferences.ts` — persiste preferências de UI no banco (sidebar_collapsed, theme) | `updateAvatar.ts` — atualiza avatar com URL da BunnyCDN
- **Queries:** `getUserByEmail.ts` — busca usuário ativo por email (sem deletedAt), retorna image, preferences e company | `getUserPreferences.ts` — busca preferências do usuário logado

### projects
- **Entidade:** `Project` (Prisma) — id (UUID), companyId (fk), name, type (LANDING_PAGE | INSTITUTIONAL), isActive (bool, default true), deletedBy (string?), deletionReason (string?), deletedAt — soft delete com auditoria
- **Relações:** Um para Muitos com `Page`; belongsTo `Company`

### pages
- **Entidade:** `Page` (Prisma) — id (UUID), projectId (fk), name, slug (unique por project), content (Json), soft-delete
- **Relações:** belongsTo `Project`

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
  - `updatePageContentData.ts` — persiste valores preenchidos em `Page.contentData`; valida, autoriza, revalida
  - `togglePagePublish.ts` — toggle `isPublished`; valida acesso por companySlug; revalida listagem
- **Queries:** 
  - `getProjects.ts` — busca projetos ativos (isActive: true, deletedAt: null) com filtro opcional por tipo; retorna com contagem de páginas
  - `getPagesByProjectId.ts` — busca páginas de um projeto específico; ordena por criação decrescente

### dev
- **Queries:**
  - `getCompanies.ts` — lista todas empresas ativas com contagem de users/projects
  - `getRecentCompanies.ts` — últimas N empresas criadas (padrão 3)
  - `getRecentUsers.ts` — últimos N usuários DEFAULT (padrão 3), inclui company
  - `getUsers.ts` — todos os usuários ativos com company e role
- **Actions:**
  - `createCompany.ts` — cria empresa; valida slug único; revalida dev dashboard
  - `editCompany.ts` — edita nome/slug/descrição de empresa; valida conflito de slug
  - `deleteCompany.ts` — soft delete de empresa (set deletedAt)
  - `createUser.ts` — cria usuário com role DEFAULT vinculado a empresa; hash bcrypt

### admin
- **Queries:**
  - `getLoginLogs.ts` — lista tentativas falhas de login (limit param)
  - `getLoginLogsByIp.ts` — filtra por IP
  - `getAdminStats.ts` — contagens globais: usersCount, developersCount, companiesCount, blockedCount
  - `getAdminCompanies.ts` — todas as empresas ativas com contagem de users/projects
  - `getAdminUsers.ts` — usuários com role DEFAULT/ADMIN, inclui company
  - `getAdminDevelopers.ts` — usuários com role DEVELOPER, inclui company
  - `getBlockedIps.ts` — IPs com 3+ tentativas na última hora, agrupados com contagem e emails
- **Actions:**
  - `unblockIp.ts` — remove bloqueio de um IP (admin-only)
  - `adminCreateCompany.ts` — cria empresa; verifica role ADMIN
  - `adminEditCompany.ts` — edita empresa; verifica role ADMIN; valida conflito de slug
  - `adminDeleteCompany.ts` — soft delete de empresa; verifica role ADMIN
  - `adminCreateUser.ts` — cria usuário com role DEFAULT; verifica role ADMIN; hash bcrypt
  - `createDeveloper.ts` — cria usuário com role DEVELOPER; verifica role ADMIN; hash bcrypt

### upload
- **Actions:** `uploadImage.ts` — converte imagens para .avif via sharp (quality: 80), suporta subpastas dinâmicas (folder: 'avatars'), upload para BunnyCDN
- **Actions:** `uploadMedia.ts` — suporta image (→ AVIF) e video (direto raw); valida tamanho (5MB img / 200MB vídeo); envia para BunnyCDN; retorna URL pública

### auth
- **Actions:** `checkIpStatus.ts` — Server Action que verifica status de bloqueio do IP, retorna `{ blocked, remainingSeconds, reason }`

---

## Componentes

- `src/components/auth/LoginForm.tsx` — Client — formulário de login com useActionState + checkIpStatus, countdown regressivo (MM:SS), overlay bloqueio com cor #514030
- `src/components/dev/DevSidebar.tsx` — Client — sidebar colapsável exclusiva do Dev Dashboard; links para dashboard, empresas, usuários e configurações do dev
- `src/components/admin/AdminSidebar.tsx` — Client — sidebar colapsável exclusiva do Admin Panel; links para `/dashboard-admin/*` (dashboard, empresas, desenvolvedores, usuários, logs, configurações)
- `src/components/dashboard/Sidebar.tsx` — Client — sidebar colapsável com useState(initialCollapsed) + startTransition; logo 48px→28px; toggle PanelLeftClose/PanelLeftOpen; avatar next/image + fallback UserCircle; estado persistido via updatePreferences em background
- `src/components/schema-builder/SchemaBuilderEditor.tsx` — Client — workspace 3 painéis: Esquerda (w-72) com Tabs Estrutura/Componentes — Estrutura lista seções com ícone `Layers`, `Trash2` hover-only para excluir via Monaco ref e click para `scrollIntoView` no preview com ring highlight 1s; Componentes tem 8 cards de snippets com ícone/descrição; Centro: Monaco full-width endpoint; IDs únicos por sufixo random ao inserir snippet; Direita: LiveFormPreview reativo
- `src/components/schema-builder/LiveFormPreview.tsx` — Client — preview read-only; aceita `focusedSectionId?: string | null`; cada seção tem `id="section-{key}"` para `scrollIntoView`; highlight `ring-2 ring-brand-primary/20` quando focada; suporta tipos: text, textarea, image, number, color, boolean, select, url, html, list, video
- `src/components/schema-builder/IframePreview.tsx` — Client — iframe de preview com toggle Desktop/Tablet/Mobile; fallback elegante quando sem previewUrl; mobile simula iPhone (375px), tablet simula iPad (768px)
- `src/components/schema-builder/DynamicForm.tsx` — Client — formulário dinâmico com upload CDN BunnyCDN para `image` (→ AVIF) e `video` (direto); `uploadingFields: Set<string>` e `uploadErrors` por campo; botão Salvar desabilitado durante upload; suporta todos os tipos: text, textarea, image, number, color, boolean, select, url, html, list, video; tipo `list` dinâmico com adicionar/remover/itens e sub-campos (`itemFields`); chave de seção via `section.id ?? section.name ?? section.section`
- `src/components/projects/CreatePageModal.tsx` — Client — modal de criação de página com nome e slug (auto-gerado); valida slug único por projeto
- `src/components/projects/PublishPageButton.tsx` — Client — toggle Publicar/Despublicar com ícones Globe/GlobeOff; server action `togglePagePublish`
- `src/components/projects/EditPageContainer.tsx` — Client — container que gerencia estado e key incremental do `EditPageModal` (força re-mount com dados frescos)
- `src/components/projects/EditPageModal.tsx` — Client — modal de edição de página (nome/slug); usa `useActionState` + `useEffect` para fechar; aviso sobre slug alterar URL da API
- `src/components/projects/EditProjectContainer.tsx` — Client — container com key incremental para `EditProjectModal` (força re-mount com previewUrl atualizado)
- `src/components/projects/EditProjectModal.tsx` — Client — modal de configurações do projeto (nome + previewUrl); salva via `updateProject`
- `src/components/ui/toast-container.tsx` — Client — toast notifications (success/error) com tokens semânticos
- `src/components/_archived_builder/*` — **ARQUIVADO** — Low-code builder antigo (não importado em nenhuma rota; excluído do tsconfig)
- `src/components/users/update-avatar-modal.tsx` — Client — modal com Dialog/Tabs para upload de avatar via arquivo ou URL com preview
- `src/components/ThemeProvider.tsx` — Client — provedor de tema para dashboard com preferências do usuário
- `src/components/GlobalThemeProvider.tsx` — Client — provedor global de tema com sincronização periódica

---

## Páginas

- `src/app/page.tsx` — root redireciona para `/dev/[id]/dashboard` (DEVELOPER) ou `/{companySlug}/dashboard` (outros roles)
- `src/app/dev/[devId]/dashboard/layout.tsx` — layout protegido do Dev; valida role=DEVELOPER e devId === session.user.id; suporte a DevSidebar colapsável via CSS var
- `src/app/dev/[devId]/dashboard/page.tsx` — resumo: últimas 3 empresas + últimos 3 usuários, com links "Ver todas/todos"
- `src/app/dev/[devId]/dashboard/companies/page.tsx` — Server Component; busca getCompanies(); passa para CompaniesClient
- `src/app/dev/[devId]/dashboard/companies/CompaniesClient.tsx` — Client — CRUD de empresas: criar, editar, soft-delete via Dialog/useActionState
- `src/app/dev/[devId]/dashboard/users/page.tsx` — Server Component; busca getUsers() e getCompanies(); passa para UsersClient
- `src/app/dev/[devId]/dashboard/users/UsersClient.tsx` — Client — tabela de usuários + modal de criação com Select de empresa
- `src/app/dev/[devId]/dashboard/settings/page.tsx` — Server Component; busca user do DB; passa para DevSettingsClient
- `src/app/dev/[devId]/dashboard/settings/DevSettingsClient.tsx` — Client — perfil + segurança + preferências (sem aba Empresa)
- `src/app/dashboard-admin/layout.tsx` — layout protegido do Admin; valida role=ADMIN; AdminSidebar + ThemeProvider
- `src/app/dashboard-admin/page.tsx` — dashboard global: 4 cards de métricas + listas de últimas empresas/usuários
- `src/app/dashboard-admin/companies/page.tsx` + `AdminCompaniesClient.tsx` — CRUD completo de empresas (criar/editar/soft-delete)
- `src/app/dashboard-admin/users/page.tsx` + `AdminUsersClient.tsx` — tabela de usuários DEFAULT/ADMIN + modal de criação
- `src/app/dashboard-admin/developers/page.tsx` + `AdminDevelopersClient.tsx` — tabela de DEVELOPERs + modal de criação com role DEVELOPER
- `src/app/dashboard-admin/logs/page.tsx` + `AdminLogsClient.tsx` — Tabs: IPs Bloqueados (com botão Desbloquear) + Tentativas Recentes
- `src/app/dashboard-admin/settings/page.tsx` — configurações do admin; reutiliza DevSettingsClient
- `src/app/(auth)/login/page.tsx` — tela de login (Server Component)
- `src/app/[companySlug]/dashboard/layout.tsx` — layout protegido; valida se usuário pode acessar a empresa; busca image e preferences do DB; passa initialCollapsed, email e image como props para Sidebar
- `src/app/[companySlug]/dashboard/page.tsx` — dashboard principal com dados reais de projetos; busca institutional e landing page projects; exibe estatísticas; links dinâmicos para /sites e /landing-pages
- `src/app/[companySlug]/dashboard/sites/page.tsx` — listagem de sites (INSTITUTIONAL); grid de cards com projeto, data, contagem de páginas; botão Gerenciar aponta para /sites/[siteId]/pages
- `src/app/[companySlug]/dashboard/landing-pages/page.tsx` — listagem de landing pages; mesma estrutura com variações visuais

**Layouts Aninhados (Contexto de Projeto):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/layout.tsx` — layout aninhado; renderiza ContextSidebar; valida acesso ao projeto; herda pelo dashboard
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/layout.tsx` — layout aninhado para landing pages; mesma estrutura de validação

**Páginas de Contexto (Sites):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` — listagem de páginas; botões: Publicar, Configurações, Construir, Editar; modal CreatePageModal funcional
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

- **Company** (`companies`) — id (UUID), slug (unique, indexed), name (string), description (String?), logo (String?), **createdById (UUID?, id do criador)**, createdAt, updatedAt, deletedAt
- **User** (`users`) — id (UUID), email (unique), password (text), role (**DEFAULT/ADMIN/DEVELOPER**), image (String?), preferences (Json? default {}), **companyId (UUID, fk→companies)**, **createdById (UUID?, id do criador)**, requiresPasswordReset (bool), createdAt, updatedAt, deletedAt
- **LoginAttempt** (`login_attempts`) — id (UUID), ip (string, indexed), email (string optional), createdAt
- **Project** (`projects`) — id (UUID), companyId (UUID, fk→companies), name (string), type (LANDING_PAGE|INSTITUTIONAL), **previewUrl (String?, nullable)**, isActive (bool), deletedBy, deletionReason, deletedAt, createdAt, updatedAt
- **Page** (`pages`) — id (UUID), projectId (UUID, fk→projects), name, slug (unique per project), content (Json, legacy), **schemaData (Json, default {}, headless schema)**, **contentData (Json, default {}, valores preenchidos)**, isPublished (bool, default false), createdAt, updatedAt, deletedAt
- **ProjectHistory** (`project_histories`) — id (UUID), projectId (UUID, fk→projects), userId (UUID, fk→users), previousState (Json?), newState (Json?), version (Int), createdAt

---

## Lib / Utilitários

- `src/lib/prisma.ts` — singleton do PrismaClient com `accelerateUrl` (Prisma 7, export `db`)
- `src/lib/auth.config.ts` — NextAuthConfig base: authorized callback trata 3 casos (rota raiz, /dev/[devId]/dashboard, /[slug]/dashboard); DEVELOPER pode acessar qualquer rota tenant sem redirect
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
- **Actions:** `createBlogPost.ts`, `updateBlogPost.ts`, `deleteBlogPost.ts` — CRUD artigos com tags M:N
- **Actions:** `toggleBlogEnabled.ts` — ativa/desativa blog por projeto
- **Queries:** `getBlogCategories.ts`, `getBlogTags.ts`, `getBlogPosts.ts`, `getBlogPost.ts`

## Componentes Blog

- `src/components/blog/RichEditor.tsx` — Client — editor Tiptap com toolbar, upload de imagem inline (BunnyCDN)
- `src/components/blog/CategoryModal.tsx` — Client — modal criar/editar categoria com upload de imagem
- `src/components/blog/TagModal.tsx` — Client — modal criar/editar tag com upload de imagem
- `src/components/blog/CategoriesClient.tsx` — Client — listagem de categorias com ações
- `src/components/blog/TagsClient.tsx` — Client — listagem de tags com ações
- `src/components/blog/PostsListClient.tsx` — Client — tabela de artigos com busca e ações
- `src/components/blog/PostEditorClient.tsx` — Client — editor de artigo em abas (Principal/Conteúdo/Mídia/SEO)

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

- **BlogCategory** (`blog_categories`) — name, description, imageUrl, slug, projectId | CASCADE do Project
- **BlogTag** (`blog_tags`) — name, description, imageUrl, slug, projectId | CASCADE do Project
- **BlogPost** (`blog_posts`) — title, subtitle, body, publishedAt, coverImageUrl, authorName, SEO fields, projectId, categoryId | CASCADE do Project
- **BlogPostTag** (`blog_post_tags`) — join M:N BlogPost ↔ BlogTag | CASCADE ambos os lados
- **Project** — campo `blogEnabled Boolean @default(false)` adicionado

---

## Últimas alterações

| Data       | Arquivo                                       | O que foi feito                                            |
| :--------- | :-------------------------------------------- | :--------------------------------------------------------- |
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
