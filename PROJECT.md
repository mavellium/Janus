# PROJECT.md — Registro do Janus

> **Leia este arquivo no início de cada sessão.**
> **Atualize-o sempre que criar, mover ou deletar qualquer arquivo.**
> Objetivo: Claude sabe o que existe sem precisar ler todos os arquivos.

---

## Módulos

### users
- **Entidade:** `src/modules/users/domain/User.ts` — usuário com role DEFAULT/ADMIN, normaliza email, valida hash
- **Erros:** `src/modules/users/domain/errors.ts` — INVALID_EMAIL, INVALID_PASSWORD, EMAIL_ALREADY_EXISTS, INVALID_CREDENTIALS
- **Actions:** `registerUser.ts` — cria usuário com bcrypt hash | `signInAction.ts` — form action para Auth.js (useActionState)
- **Queries:** `getUserByEmail.ts` — busca usuário ativo por email (sem deletedAt)

### admin
- **Queries:** `getLoginLogs.ts` — lista tentativas falhas de login | `getLoginLogsByIp.ts` — filtra por IP
- **Actions:** `unblockIp.ts` — remove bloqueio de um IP (admin-only)

### auth
- **Actions:** `checkIpStatus.ts` — Server Action que verifica status de bloqueio do IP, retorna `{ blocked, remainingSeconds, reason }`

---

## Componentes

- `src/components/auth/LoginForm.tsx` — Client — formulário de login com useActionState + checkIpStatus, countdown regressivo (MM:SS), overlay bloqueio com cor #514030
- `src/components/dashboard/Sidebar.tsx` — Server — sidebar reutilizável (fundo #C8C8C8, itens #161718, ativo #514030), menu items com rotas, user info dinâmico, botão logout

---

## Páginas

- `src/app/page.tsx` — root redireciona para /dashboard (redirect)
- `src/app/(auth)/login/page.tsx` — tela de login (Server Component)
- `src/app/dashboard/layout.tsx` — layout protegido com Sidebar integrada (flex layout: sidebar + main)
- `src/app/dashboard/page.tsx` — dashboard principal com header, banner promo, cards Sites e Landing Pages

---

## Schema Prisma

- **User** (`users`) — id (UUID), email (unique), password (text), role (DEFAULT/ADMIN), createdAt, updatedAt, deletedAt
- **LoginAttempt** (`login_attempts`) — id (UUID), ip (string, indexed), email (string optional), createdAt

---

## Lib / Utilitários

- `src/lib/prisma.ts` — singleton do PrismaClient com `accelerateUrl` (Prisma 7, export `db`)
- `src/lib/auth.config.ts` — NextAuthConfig base: JWT callbacks, role/id augmentation (Edge Runtime safe)
- `src/lib/auth.ts` — NextAuth v5: CredentialsProvider + PrismaAdapter + JWT strategy
- `src/lib/utils.ts` — `cn`, `formatCurrency` (BRL), `formatDate` (pt-BR)

---

## Configuração de Testes

- `vitest.config.ts` — jsdom, globals, alias `@/*`, setupFiles
- `src/test/setup.ts` — importa `@testing-library/jest-dom/vitest`
- `src/modules/users/domain/User.spec.ts` — 6 testes: create, reconstitute, toObject
- `src/test/create-test-user.spec.ts` — 5 fases de teste para criar usuário teste2@gmail.com
- `src/lib/auth.spec.ts` — teste de error handling para LoginAttempt
- `scripts/seed-test-user.ts` — script seed para criar usuário de teste via CLI
- `scripts/test-db-connection.ts` — script para testar conectividade com PostgreSQL
- `SETUP_TEST_USER.md` — guia de setup e uso do usuário de teste

---

## Infraestrutura e Auth

- `src/lib/auth.config.ts` — NextAuthConfig oficial v5: session JWT + callback authorized (proteção de rotas) + callbacks jwt/session para id/role
- `src/middleware.ts` — NextAuth(authConfig).auth (padrão oficial); matcher: `/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg).*)`
- `src/lib/auth.ts` — NextAuth v5 com Credentials Provider, PrismaAdapter e Brute Force Protection (3+ falhas em 1 hora = bloqueado)
- `src/app/api/auth/[...nextauth]/route.ts` — Route Handler do Auth.js (GET, POST)
- `src/types/next-auth.d.ts` — augmentação de tipos: id e role na Session/JWT
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

---

## ⚠️ Notas de Ambiente

**Node.js Versão:** Requer Node.js 18+ (suporte a ES2021 para operador `??=` usado por Next.js 16)
- Desenvolvimento atual com Node.js v14.21.3 causará erro de build
- Atualize para Node.js 18 LTS ou superior antes de fazer build/deploy
