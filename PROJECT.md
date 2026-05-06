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

---

## Componentes

- `src/components/auth/LoginForm.tsx` — Client — formulário de login com useActionState, paleta brand

---

## Páginas

- `src/app/(auth)/login/page.tsx` — tela de login (Server Component)
- `src/app/(dashboard)/layout.tsx` — layout protegido com verificação de sessão

---

## Schema Prisma

- **User** (`users`) — id (UUID), email (unique), password (text), role (DEFAULT/ADMIN), createdAt, updatedAt, deletedAt

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

---

## Infraestrutura e Auth

- `src/lib/auth.config.ts` — NextAuthConfig base com callback `authorized` para proteção de rotas (nega acesso a não-autenticados em rotas não-públicas)
- `middleware.ts` — matcher specificamente: `/`, `/dashboard/:path*`, `/login`, `/register`; redireciona autenticados em `/login`/`/register` para `/dashboard`
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
| 2026-05-06 | `src/lib/auth.config.ts`                      | NextAuthConfig separado para Edge Runtime compatibility    |
| 2026-05-06 | `src/lib/auth.ts`                             | Atualizado: PrismaAdapter + imports de auth.config         |
| 2026-05-06 | `middleware.ts`                               | Lógica bidirecional: protege /dashboard e redireciona auth |
| 2026-05-06 | `src/lib/auth.config.ts`                      | Adicionado callback authorized para proteção de rotas      |
| 2026-05-06 | `middleware.ts`                               | Matcher refinado: ['/', '/dashboard/:path*', '/login', '/register'] |
