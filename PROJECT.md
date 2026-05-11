# PROJECT.md — Registro do Janus (Multi-Tenant)

> **Leia este arquivo no início de cada sessão.**
> **Atualize-o sempre que criar, mover ou deletar qualquer arquivo.**
> Objetivo: Claude sabe o que existe sem precisar ler todos os arquivos.

---

## Arquitetura Multi-Tenant

Janus é um sistema de gerenciamento de projetos Multi-Tenant focado em empresas. Cada usuário pertence a uma `Company` e acessa suas páginas/projetos através de rotas namespaceadas por `[companySlug]`.

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
- **Actions:** `softDeleteProject.ts` — inativa projeto (isActive: false), registra deletedBy, deletionReason, deletedAt; revalida rotas de sites e landing-pages
- **Queries:** 
  - `getProjects.ts` — busca projetos ativos (isActive: true, deletedAt: null) com filtro opcional por tipo; retorna com contagem de páginas
  - `getPagesByProjectId.ts` — busca páginas de um projeto específico; ordena por criação decrescente

### admin
- **Queries:** `getLoginLogs.ts` — lista tentativas falhas de login | `getLoginLogsByIp.ts` — filtra por IP
- **Actions:** `unblockIp.ts` — remove bloqueio de um IP (admin-only)

### upload
- **Actions:** `uploadImage.ts` — converte imagens para .avif via sharp (quality: 80), suporta subpastas dinâmicas (folder: 'avatars'), upload para BunnyCDN

### auth
- **Actions:** `checkIpStatus.ts` — Server Action que verifica status de bloqueio do IP, retorna `{ blocked, remainingSeconds, reason }`

---

## Componentes

- `src/components/auth/LoginForm.tsx` — Client — formulário de login com useActionState + checkIpStatus, countdown regressivo (MM:SS), overlay bloqueio com cor #514030
- `src/components/dashboard/Sidebar.tsx` — Client — sidebar colapsável com useState(initialCollapsed) + startTransition; logo 48px→28px; toggle PanelLeftClose/PanelLeftOpen; avatar next/image + fallback UserCircle; estado persistido via updatePreferences em background
- `src/components/dashboard/ContextSidebar.tsx` — **Novo:** Sidebar de contexto para dentro de projetos (sites/landing-pages); exibe nome do projeto, tipo, links para Páginas/Resultados/Blog; destaca seção atual
- `src/components/builder/CoreRenderer.tsx` — Client — renderização pura HTML de EditorNode; usado no preview e pelo RenderNode
- `src/components/builder/RenderNode.tsx` — Client — wrapper de edição com feedback visual (ring azul + tag flutuante); usa CoreRenderer via renderChild
- `src/components/builder/Canvas.tsx` — Client — área de drop do builder; renderiza nodes com RenderNode
- `src/components/builder/PropertiesPanel.tsx` — Client — painel de propriedades contextual por tipo (Layout, Tipografia, Aparência)
- `src/components/builder/ComponentsPanel.tsx` — Client — paleta de componentes arrastáveis para o canvas
- `src/components/users/update-avatar-modal.tsx` — Client — modal com Dialog/Tabs para upload de avatar via arquivo ou URL com preview
- `src/components/ThemeProvider.tsx` — Client — provedor de tema para dashboard com preferências do usuário
- `src/components/GlobalThemeProvider.tsx` — Client — provedor global de tema com sincronização periódica

---

## Páginas

- `src/app/page.tsx` — root redireciona para `/{companySlug}/dashboard` (redireciona para empresa do usuário autenticado)
- `src/app/(auth)/login/page.tsx` — tela de login (Server Component)
- `src/app/[companySlug]/dashboard/layout.tsx` — layout protegido; valida se usuário pode acessar a empresa; busca image e preferences do DB; passa initialCollapsed, email e image como props para Sidebar
- `src/app/[companySlug]/dashboard/page.tsx` — dashboard principal com dados reais de projetos; busca institutional e landing page projects; exibe estatísticas; links dinâmicos para /sites e /landing-pages
- `src/app/[companySlug]/dashboard/sites/page.tsx` — listagem de sites (INSTITUTIONAL); grid de cards com projeto, data, contagem de páginas; botão Gerenciar aponta para /sites/[siteId]/pages
- `src/app/[companySlug]/dashboard/landing-pages/page.tsx` — listagem de landing pages; mesma estrutura com variações visuais

**Layouts Aninhados (Contexto de Projeto):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/layout.tsx` — layout aninhado; renderiza ContextSidebar; valida acesso ao projeto; herda pelo dashboard
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/layout.tsx` — layout aninhado para landing pages; mesma estrutura de validação

**Páginas de Contexto (Sites):**
- `src/app/[companySlug]/dashboard/sites/[siteId]/pages/page.tsx` — listagem de páginas do site; tabela com nome, slug, data; botão Editar aponta para builder
- `src/app/[companySlug]/dashboard/sites/[siteId]/analytics/page.tsx` — tela de resultados (placeholder)
- `src/app/[companySlug]/dashboard/sites/[siteId]/blog/page.tsx` — tela de blog (placeholder)

**Páginas de Contexto (Landing Pages):**
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/page.tsx` — listagem de páginas da landing page
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/analytics/page.tsx` — tela de resultados
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/blog/page.tsx` — tela de blog

**Construtor Low-Code Visual:**
- `src/app/[companySlug]/dashboard/sites/[siteId]/pages/[pageId]/builder/page.tsx` — editor visual com layout 3 colunas: componentes (esquerda), canvas (centro #EBE6DA), propriedades (direita); top bar com Sair, Desfazer/Refazer, Salvar, Publicar
- `src/app/[companySlug]/dashboard/landing-pages/[lpId]/pages/[pageId]/builder/page.tsx` — mesmo construtor para landing pages

---

## Schema Prisma

- **Company** (`companies`) — id (UUID), slug (unique, indexed), name (string), description (String?), logo (String?), createdAt, updatedAt, deletedAt
- **User** (`users`) — id (UUID), email (unique), password (text), role (DEFAULT/ADMIN), image (String?), preferences (Json? default {}), **companyId (UUID, fk→companies)**, createdAt, updatedAt, deletedAt
- **LoginAttempt** (`login_attempts`) — id (UUID), ip (string, indexed), email (string optional), createdAt
- **Project** (`projects`) — id (UUID), companyId (UUID, fk→companies), name (string), type (LANDING_PAGE|INSTITUTIONAL), createdAt, updatedAt, deletedAt
- **Page** (`pages`) — id (UUID), projectId (UUID, fk→projects), name (string), slug (string, unique per project), content (Json default {}), createdAt, updatedAt, deletedAt
- **ProjectHistory** (`project_histories`) — id (UUID), projectId (UUID, fk→projects), userId (UUID, fk→users), previousState (Json?), newState (Json?), version (Int), createdAt

---

## Lib / Utilitários

- `src/lib/prisma.ts` — singleton do PrismaClient com `accelerateUrl` (Prisma 7, export `db`)
- `src/lib/auth.config.ts` — NextAuthConfig base: JWT callbacks propagam apenas id, role, image (preferences removido para evitar HTTP 431)
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

- `src/app/globals.css` — variáveis brand: primary, text, btn-dark, btn-light, hover, muted, bg
- `tailwind.config.ts` — conteúdo `src/**/*.{ts,tsx}`, cores brand mapeadas

---

## Últimas alterações

| Data       | Arquivo                                       | O que foi feito                                            |
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
