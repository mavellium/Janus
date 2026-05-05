# PROJECT.md — Registro do Janus

> **Leia este arquivo no início de cada sessão.**
> **Atualize-o sempre que criar, mover ou deletar qualquer arquivo.**
> Objetivo: Claude sabe o que existe sem precisar ler todos os arquivos.

---

## Módulos

_Nenhum módulo criado ainda._

---

## Componentes

_Nenhum componente criado ainda._

---

## Páginas

_Nenhuma página criada ainda._

---

## Schema Prisma

_Nenhum model criado ainda._

---

## Lib / Utilitários

- `src/lib/prisma.ts` — singleton do PrismaClient (export `db`)
- `src/lib/utils.ts` — `cn`, `formatCurrency` (BRL), `formatDate` (pt-BR)

---

## Configuração de Testes

- `vitest.config.ts` — jsdom, globals, alias `@/*`, setupFiles
- `src/test/setup.ts` — importa `@testing-library/jest-dom/vitest`

---

## Últimas alterações

| Data       | Arquivo              | O que foi feito                                                      |
| :--------- | :------------------- | :------------------------------------------------------------------- |
| 2026-05-05 | `src/lib/prisma.ts`  | Singleton do Prisma com Prisma 7 (export `db`)                       |
| 2026-05-05 | `src/lib/utils.ts`   | `cn`, `formatCurrency` (BRL), `formatDate` (pt-BR)                    |
| 2026-05-05 | `vitest.config.ts`   | Vitest com jsdom, globals, alias `@/*`, setupFiles                   |
| 2026-05-05 | `src/test/setup.ts`  | Testing Library setup (`jest-dom/vitest`)                            |
| 2026-05-05 | `package.json`       | Instalado `@testing-library/jest-dom`, `jsdom` (devDeps)              |
| 2026-05-05 | `prisma.config.ts`   | Configurado datasource URL via env vars (Prisma 7)                    |
| 2026-05-05 | `src/app/globals.css`| Simplificado para @tailwind base/components/utilities                 |
| 2026-05-05 | commit `79ae254`     | **setup:** initial project structure and dev environment (master)     |
