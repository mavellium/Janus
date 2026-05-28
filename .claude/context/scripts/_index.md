# Scripts — Sumário Executivo

Gerenciamento de scripts externos (analytics, pixels, chat widgets) injetados no HTML de projetos. Cada script é vinculado a um projeto e posicionado no HEAD ou BODY_END.

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Entidade | `SiteScript` — id, projectId, name, code (text), position (HEAD/BODY_END), isActive, createdAt, updatedAt |
| CRUD | `createScript`, `updateScript`, `deleteScript`, `toggleScript` |
| Query | `getScriptsByProjectId` |

## Actions (`src/modules/scripts/actions/`)

| Action | Guard | Descrição |
|--------|-------|-----------|
| `createScript` | Autenticado + slug match | Cria script com name, code, position (HEAD/BODY_END) |
| `updateScript` | Autenticado + slug match | Atualiza name, code, position |
| `deleteScript` | Autenticado + slug match | Hard delete |
| `toggleScript` | Autenticado + slug match | Toggle `isActive` |

## Queries (`src/modules/scripts/queries/`)

| Query | Retorno |
|-------|---------|
| `getScriptsByProjectId(projectId)` | Scripts ativos e inativos do projeto |

## Enum Position

| Valor | Injeção |
|-------|---------|
| `HEAD` | Dentro de `<head>` — ideal para analytics, meta pixels |
| `BODY_END` | Antes de `</body>` — ideal para chat widgets, scripts pesados |

## Páginas

```
/{slug}/dashboard/sites/{siteId}/scripts        — listagem + CRUD
/{slug}/dashboard/landing-pages/{lpId}/scripts   — mesma estrutura
```

## API de Saída

Scripts ativos são incluídos na resposta da API pública de conteúdo, separados por position, para o front injetar.

## Para usar este módulo, você deve saber

- [ ] `code` armazena o HTML/JS raw (tag `<script>` completa ou inline)
- [ ] `isActive=false` desabilita sem deletar
- [ ] Validação de acesso: session.user.companySlug deve match com empresa do projeto
- [ ] ADMIN pode gerenciar scripts de qualquer projeto
- [ ] Position é enum Prisma: `HEAD` | `BODY_END`
