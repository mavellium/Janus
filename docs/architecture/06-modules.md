# 06 — Módulos de Domínio

A lógica de negócio fica em [src/modules/](../../src/modules/), isolada por
domínio. Cada módulo segue a convenção `domain/` (regras tipadas, quando há),
`actions/` (Server Actions de mutação) e `queries/` (leitura Prisma), conforme a
Clean Architecture descrita em [CLAUDE.md](../../CLAUDE.md).

Existem **12 módulos**. Vários possuem documentação operacional dedicada para
agentes em [`.claude/context/`](../../.claude/context/) — referenciada na última
coluna.

| Módulo | Responsabilidade | Conteúdo principal | Docs `.claude/context` |
|---|---|---|---|
| **admin** | Painel ADMIN: CRUD de empresas/usuários, criação de developers, gestão de guests/guest-posts, permissões, desbloqueio de IP, toggle de blog/guest-mode | `actions/` (17), `queries/` (6) | [admin/](../../.claude/context/admin/) |
| **analytics** | Configuração e leitura de GA4 por projeto/empresa | `actions/`, `queries/` | [analytics/](../../.claude/context/analytics/) |
| **auth** | Login auxiliar, status de IP, **impersonation** e modo privilegiado, return URL | `actions/` (5), `queries/` | [permissions/](../../.claude/context/permissions/) |
| **blog** | CRUD de posts/categorias/tags, toggle `blogEnabled` | `actions/` (10), `queries/` (5) | [blog/](../../.claude/context/blog/) |
| **cms** | Construção/edição de páginas (modos legacy e avançado), publicação | `actions/` (7), `components/` | [cms/](../../.claude/context/cms/) |
| **companies** | Operações de empresa (ex.: configuração de webhook) | `actions/` | [companies/](../../.claude/context/companies/) |
| **dev** | Painel DEVELOPER: empresas/usuários e estatísticas | `actions/` (5), `queries/` (7) | [dev/](../../.claude/context/dev/) |
| **guests** | Fluxo de convidado: registro, confirmação e CRUD de guest-posts | `actions/` (5) | [guests/](../../.claude/context/guests/) |
| **projects** | CRUD de projetos e páginas, soft delete de projeto, modos/conteúdo de página | `actions/` (12), `queries/` (2) | [projects/](../../.claude/context/projects/) |
| **scripts** | Scripts de site (injeção em HEAD/BODY_END), toggle de ativação | `actions/` (4), `queries/` | [scripts/](../../.claude/context/scripts/) |
| **upload** | Orquestração de upload de imagem/mídia | `actions/` (2) | [upload/](../../.claude/context/upload/) |
| **users** | Ciclo de vida do usuário: registro, perfil, senha, preferências, avatar | `domain/`, `actions/` (8), `queries/` | [users/](../../.claude/context/users/) |

> Há também um diretório de contexto [backup/](../../.claude/context/backup/) que
> documenta os scripts de backup ([src/scripts/](../../src/scripts/)) — esses
> scripts rodam fora do Next.js e não formam um módulo em `src/modules/`. Ver
> [08-integrations-and-jobs.md](08-integrations-and-jobs.md).

## Sobreposição CMS × Projects

Os módulos **cms** e **projects** contêm actions de **edição de página com nomes
sobrepostos** — por exemplo `createPage`, `updatePageMode`, `updatePageContent`,
`updatePageContentData`, `updatePageSchema`, `togglePagePublish` existem em
**ambos** [src/modules/cms/actions/](../../src/modules/cms/actions/) e
[src/modules/projects/actions/](../../src/modules/projects/actions/).

> ⚠️ A confirmar: qual conjunto é o canônico para cada fluxo. Essa duplicação é
> registrada em [99-tech-debt.md](99-tech-debt.md). Antes de alterar qualquer
> fluxo de CMS, consultar [`.claude/context/cms/`](../../.claude/context/cms/)
> (regras obrigatórias: `structuredClone`, `setDeep`, `unstable_noStore`,
> full-replace de `contentData`), conforme exigido pelo
> [CLAUDE.md](../../CLAUDE.md).

## Componentes associados

A UI correspondente fica em [src/components/](../../src/components/), com
subpastas espelhando domínios: `admin/`, `analytics/`, `blog/`, `cms/`,
`schema-builder/` (builder do CMS), `dashboard/`, `dev/`, `guest/`, `projects/`,
`scripts/`, `users/`, além de `ui/` (shadcn/Radix). Há também um
`_archived_builder/` (excluído do `tsconfig`).
