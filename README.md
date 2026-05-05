# Janus

Sistema web fullstack — Next.js + Prisma + PostgreSQL.

## Stack

- **Next.js 16** — App Router, Server Components, Server Actions
- **React 19** — useActionState, useTransition
- **Prisma 7** — ORM e migrations
- **PostgreSQL** — banco de dados
- **TypeScript 5** — tipagem estrita
- **Tailwind CSS 3** — estilização
- **shadcn/ui** + **Radix UI** — componentes
- **Zod 4** — validação
- **Vitest 4** + **Testing Library** — testes
- **lucide-react** — ícones

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando (local ou Docker)

## Instalação

```bash
git clone https://github.com/sua-org/janus.git
cd janus
npm install
cp .env.example .env   # preencher DATABASE_URL
npm run db:migrate
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## .env

```env
DATABASE_URL="postgresql://user:password@localhost:5432/janus"
```

## Comandos

```bash
npm run dev           # desenvolvimento
npm run build         # build de produção
npm run start         # iniciar produção
npm run typecheck     # verificar tipos
npm run lint          # ESLint
npm run test          # testes
npm run test:coverage # cobertura
npm run db:migrate    # nova migration
npm run db:studio     # Prisma Studio
npm run db:seed       # seed de desenvolvimento
```

## Documentação

- `CLAUDE.md` — contexto para o Claude Code
- `PROJECT.md` — registro de tudo que existe no projeto
- `docs/workflows/` — guias de desenvolvimento