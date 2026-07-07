# Notifications — Entidades e Domínio

## Entidade: SystemRelease (`src/modules/notifications/domain/release.ts`)
- **Tipo:** TypeScript interface (sem model Prisma — dados vêm da API do GitHub)
- **Campos:** id (number, id da release no GitHub), tagName (string, ex: `v1.2.0`), name (string | null, título da release), bodyHtml (string, release notes em HTML **já sanitizado**), publishedAt (string ISO | null), htmlUrl (string, link da release no GitHub), prerelease (boolean)
- **Invariantes:**
  - `bodyHtml` sempre passa por `sanitizeArticleHtml()` (`src/lib/sanitize-html.ts`) antes de chegar à UI — nunca renderizar HTML cru da API.
  - Releases com `draft: true` nunca entram na listagem.

## Erros
- Sem códigos de erro próprios: falha de rede/API retorna `[]` (lista) ou `null` (versão). UI trata como estado vazio.

## Interfaces/Types
- `GithubRelease` (interno à query) — shape da resposta da API com media type `application/vnd.github.html+json` (fornece `body_html` pronto, dispensando parser de markdown local).
