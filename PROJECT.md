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
- **Actions:** `registerUser.ts` — cria usuário com bcrypt hash e `companyId` = default company | `signInAction.ts` — form action para Auth.js (useActionState) | `updatePreferences.ts` — persiste preferências de UI no banco (sidebar_collapsed, theme)
- **Queries:** `getUserByEmail.ts` — busca usuário ativo por email (sem deletedAt), retorna image, preferences e company

### projects
- **Entidade:** `Project` (Prisma) — id (UUID), companyId (fk), name, type (LANDING_PAGE | INSTITUTIONAL), soft-delete
- **Relações:** Um para Muitos com `Page`; belongsTo `Company`

### pages
- **Entidade:** `Page` (Prisma) — id (UUID), projectId (fk), name, slug (unique por project), content (Json), soft-delete
- **Relações:** belongsTo `Project`

### projectHistories
- **Entidade:** `ProjectHistory` (Prisma) — id (UUID), projectId (fk), userId (fk), previousState (Json), newState (Json), version (Int), createdAt
- **Uso:** Auditoria de alterações em projetos; rastreia quem alterou o quê

### admin
- **Queries:** `getLoginLogs.ts` — lista tentativas falhas de login | `getLoginLogsByIp.ts` — filtra por IP
- **Actions:** `unblockIp.ts` — remove bloqueio de um IP (admin-only)

### auth
- **Actions:** `checkIpStatus.ts` — Server Action que verifica status de bloqueio do IP, retorna `{ blocked, remainingSeconds, reason }`

---

## Componentes

- `src/components/auth/LoginForm.tsx` — Client — formulário de login com useActionState + checkIpStatus, countdown regressivo (MM:SS), overlay bloqueio com cor #514030
- `src/components/dashboard/Sidebar.tsx` — Client — sidebar colapsável com useState(initialCollapsed) + startTransition; logo 48px→28px; toggle PanelLeftClose/PanelLeftOpen; avatar next/image + fallback UserCircle; estado persistido via updatePreferences em background

---

## Páginas

- `src/app/page.tsx` — root redireciona para `/{companySlug}/dashboard` (redireciona para empresa do usuário autenticado)
- `src/app/(auth)/login/page.tsx` — tela de login (Server Component)
- `src/app/[companySlug]/dashboard/layout.tsx` — **Novo:** layout protegido; valida se usuário pode acessar a empresa; busca image e preferences do DB; passa initialCollapsed, email e image como props para Sidebar
- `src/app/[companySlug]/dashboard/page.tsx` — **Novo:** dashboard principal com header, banner promo, cards Sites e Landing Pages

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

- `src/lib/auth.config.ts` — **Atualizado:** NextAuthConfig v5 com Multi-Tenant; callback authorized valida companySlug na sessão; redireciona pós-login para `/{companySlug}/dashboard`; callbacks jwt/session propagam id, role, image, **companySlug**
- `src/middleware.ts` — NextAuth(authConfig).auth (padrão oficial); matcher: `/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)`
- `src/lib/auth.ts` — **Atualizado:** NextAuth v5; authorize retorna **companySlug** junto com user; busca Company ao autenticar
- `src/app/api/auth/[...nextauth]/route.ts` — Route Handler do Auth.js (GET, POST)
- `src/types/next-auth.d.ts` — **Atualizado:** augmentação de tipos com **companySlug** em Session/JWT/User
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
