# Documentação de Arquitetura — Janus

Esta pasta documenta a arquitetura do **Janus**, uma aplicação **Next.js 16
(App Router)** multi-tenant que serve como CMS/gestor de sites institucionais e
landing pages, com blog headless, analytics (GA4) e modo convidado (guest).

Todo o conteúdo aqui é **verificável no código-fonte**. Afirmações ainda não
confirmadas no código estão marcadas com `> ⚠️ A confirmar:`. Problemas
encontrados durante a documentação **não foram corrigidos** — estão registrados
em [99-tech-debt.md](99-tech-debt.md).

## Como ler

Sugestão de ordem de leitura para quem está chegando agora:

1. [01-overview.md](01-overview.md) — propósito, stack, mapa de pastas, visão de containers.
2. [03-multi-tenancy.md](03-multi-tenancy.md) — o conceito central: empresa → projeto → página.
3. [02-request-lifecycle.md](02-request-lifecycle.md) — como uma requisição flui (middleware, layout, Server Actions).
4. [04-auth-and-permissions.md](04-auth-and-permissions.md) — autenticação, papéis, permissões e impersonation.
5. [05-data-model.md](05-data-model.md) — entidades, relações e soft delete.
6. [06-modules.md](06-modules.md) — os 12 módulos de domínio e suas responsabilidades.
7. [07-public-api.md](07-public-api.md) — endpoints públicos (blog headless, conteúdo de página).
8. [08-integrations-and-jobs.md](08-integrations-and-jobs.md) — GA4, BunnyCDN, backups, rate-limit, deploy.
9. [99-tech-debt.md](99-tech-debt.md) — observações e dívida técnica.

## Índice

| Documento | Conteúdo |
|---|---|
| [01-overview.md](01-overview.md) | Propósito, stack verificada, estrutura de pastas, diagrama de containers |
| [02-request-lifecycle.md](02-request-lifecycle.md) | Middleware → layout → Server Component/Action → Prisma → revalidate |
| [03-multi-tenancy.md](03-multi-tenancy.md) | Modelo de tenancy por colunas, resolução por URL, isolamento de queries |
| [04-auth-and-permissions.md](04-auth-and-permissions.md) | NextAuth, papéis, permissões JSON, impersonation, bloqueio de IP |
| [05-data-model.md](05-data-model.md) | Modelos Prisma, relações, soft vs hard delete (ER diagram) |
| [06-modules.md](06-modules.md) | Os 12 módulos de `src/modules/` e responsabilidades |
| [07-public-api.md](07-public-api.md) | Contratos dos endpoints públicos, rate-limit, cache, CORS |
| [08-integrations-and-jobs.md](08-integrations-and-jobs.md) | GA4, BunnyCDN, backup daemon, deploy Docker/Traefik |
| [99-tech-debt.md](99-tech-debt.md) | Observações / dívida técnica |

## Relação com `.claude/context/`

O repositório já mantém documentação operacional voltada a agentes de IA em
[`.claude/context/`](../../.claude/context/) (módulos `cms`, `blog`, `backup`,
`analytics`, etc.). Esta documentação de arquitetura **não duplica** esse
conteúdo: ela dá a visão de conjunto e referencia os guias de `.claude/context/`
quando um detalhe operacional for relevante.

## Escopo desta documentação

- Foi produzida **apenas lendo o código** — nenhum arquivo de aplicação foi
  alterado.
- Versões e fatos foram conferidos em [package.json](../../package.json),
  [prisma/schema.prisma](../../prisma/schema.prisma) e nos arquivos citados.
- Diagramas usam **Mermaid** embutido (renderizado nativamente pelo GitHub e
  pela maioria dos visualizadores de Markdown).
