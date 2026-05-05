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

| Data       | Arquivo              | O que foi feito                                            |
| :--------- | :------------------- | :--------------------------------------------------------- |
| 2026-05-05 | `src/lib/prisma.ts`  | Criado singleton do Prisma (export `db`)                   |
| 2026-05-05 | `src/lib/utils.ts`   | Adicionados `formatCurrency` e `formatDate` ao `cn`        |
| 2026-05-05 | `vitest.config.ts`   | Configurado Vitest com jsdom, globals e alias `@/*`        |
| 2026-05-05 | `src/test/setup.ts`  | Setup do Testing Library (`jest-dom/vitest`)               |
| 2026-05-05 | `package.json`       | Instalado `@testing-library/jest-dom` e `jsdom` (devDeps)  |
| 2026-05-05 | `src/modules/`       | Criada pasta base do domínio                               |
