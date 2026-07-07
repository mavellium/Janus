# 🌐 API Pública de Conteúdo (CMS) — Endpoints

Endpoints públicos (GET, CORS `*`, rate-limit 60 req/min por IP, `Cache-Control` 60s) para
consumir o conteúdo de uma **página publicada**. Funcionam igual para os dois blocos:

| Bloco | `mode` | Campo de dados (DB) | Chave no payload geral |
|-------|--------|---------------------|------------------------|
| Avançado (`isAdvanced=true`) | `advanced` | `Page.schemaData` (JSON livre) | `schema` |
| Padrão (`isAdvanced=false`) | `standard` | `Page.contentData` (valores do form) | `content` |

> Fonte da verdade: `src/app/api/v1/content/.../route.ts`. (Obs.: `data-model.md` inverte os
> nomes; o código e o `overview.md`/`mode-advanced.md` mandam — avançado = `schemaData`.)

Pré-requisitos: `Page.isPublished = true`, projeto ativo e empresa não deletada.

---

## 1. Página inteira (já existia)

```
GET /api/v1/content/{companySlug}/{pageSlug}
```

```jsonc
{
  "slug": "home",
  "name": "Home",
  "mode": "advanced",            // novo campo: "advanced" | "standard"
  "updatedAt": "2026-06-27T...",
  "schema": { "content": { "hero": {...}, "faq": {...} } }
  // modo standard devolve "content": { ... } em vez de "schema"
}
```

## 2. Listar seções

```
GET /api/v1/content/{companySlug}/{pageSlug}/sections
```

```jsonc
{
  "slug": "home",
  "name": "Home",
  "mode": "advanced",
  "updatedAt": "2026-06-27T...",
  "sections": [
    { "key": "hero", "label": "hero" },
    { "key": "faq", "label": "faq" }
  ]
}
```

- **Avançado:** as seções são as chaves de topo dos dados; se o JSON tem um objeto `content`
  envolvendo as seções (convenção do builder), elas vêm de dentro de `content`. Chaves de
  metadado (`name`, `slug`, `schema`, `uiSchema`) são descartadas.
- **Padrão:** as seções são as chaves do `contentData`; o `label` é resolvido pelo `name` da
  seção definido no `schemaData` (definição do form).

## 3. Uma seção específica (sub-endpoint)

```
GET /api/v1/content/{companySlug}/{pageSlug}/sections/{sectionKey}
```

```jsonc
{
  "slug": "home",
  "name": "Home",
  "mode": "advanced",
  "section": "faq",
  "updatedAt": "2026-06-27T...",
  "data": { "items": [ { "question": "...", "answer": "..." } ] }
}
```

- `sectionKey` é URL-encoded. Aceita também **dot-path** (ex.: `content.faq`, `hero.slides`)
  para navegar em sub-objetos.
- Seção inexistente → `404 { "error": "Section not found" }`.

---

## Implementação

| Arquivo | Papel |
|---------|-------|
| `src/lib/cms-sections.ts` | Resolver puro de seções (`getPageData`, `resolveSectionsRoot`, `listSections`, `getSection`, `pageMode`) — testado em `cms-sections.spec.ts` |
| `src/modules/cms/queries/findPublishedPage.ts` | Busca a página publicada (empresa + projeto ativos) |
| `src/lib/cms-public.ts` | CORS, rate-limit, helpers de resposta JSON compartilhados |
| `src/app/api/v1/content/[companySlug]/[pageSlug]/route.ts` | Página inteira |
| `.../[pageSlug]/sections/route.ts` | Lista de seções |
| `.../[pageSlug]/sections/[sectionKey]/route.ts` | Seção individual |

**Para adicionar campos ao payload:** edite o resolver em `cms-sections.ts` (mantém os 3
endpoints consistentes) e atualize `cms-sections.spec.ts`.
