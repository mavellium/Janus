# Projects — Sumário Executivo

CRUD de projetos (Sites Institucionais e Landing Pages) e páginas. Cada projeto pertence a uma Company e contém páginas com schema headless (CMS).

## Responsabilidades

| Aspecto | Responsável |
|---------|-------------|
| Entidade | `Project` — id, companyId, name, type (INSTITUTIONAL/LANDING_PAGE), previewUrl, blogEnabled, cmsEnabled, cmsSyncScriptUrl |
| Entidade | `Page` — id, projectId, name, slug, content (legacy), schemaData, contentData, isPublished, previewUrl |
| CRUD Projeto | `createProject`, `updateProject`, `softDeleteProject` |
| CRUD Página | `createPage`, `updatePage`, `togglePagePublish` |
| CMS Schema | `updatePageSchema`, `updatePageMode`, `updatePageAdvancedData`, `updatePageSchemaContent` |
| CMS Content | `updatePageContent`, `updatePageContentData` |
| Queries | `getProjects`, `getPagesByProjectId` |

## Actions (`src/modules/projects/actions/`)

| Action | Guard | Descrição |
|--------|-------|-----------|
| `createProject` | Autenticado | Cria projeto + página "Home" (slug `/`) automaticamente |
| `updateProject` | Autenticado + slug match | Atualiza name, previewUrl, blogEnabled, cmsEnabled |
| `softDeleteProject` | DEV/ADMIN | Marca deletedAt + deletedBy + deletionReason |
| `createPage` | DEV/ADMIN | Valida slug único por projeto; cria com content/schemaData/contentData vazios |
| `updatePage` | Autenticado | Atualiza name e slug; valida unicidade |
| `togglePagePublish` | Autenticado | Toggle isPublished |
| `updatePageSchema` | DEV/ADMIN | Salva `schemaData` (JSON do CMS headless) |
| `updatePageSchemaContent` | Autenticado (sem role check) | Salva `schemaData` — usado pelo editor avançado para DEFAULT |
| `updatePageMode` | DEV/ADMIN | Seta campo `isAdvanced` na page |
| `updatePageAdvancedData` | DEV/ADMIN | Salva `schemaData` + `contentData` juntos |
| `updatePageContent` | Autenticado | Salva `content` (legacy editor) |
| `updatePageContentData` | Autenticado | Salva `contentData` (valores preenchidos pelo usuário) |

## Queries (`src/modules/projects/queries/`)

| Query | Retorno |
|-------|---------|
| `getProjects(companyId, type?)` | Projects com _count de pages |
| `getPagesByProjectId(projectId)` | Pages (id, name, slug, isPublished, updatedAt) |

## Tipos de Projeto

| Type | Uso | Rota Dashboard |
|------|-----|----------------|
| `INSTITUTIONAL` | Sites institucionais | `/{slug}/dashboard/sites` |
| `LANDING_PAGE` | Páginas de conversão | `/{slug}/dashboard/landing-pages` |

## Estrutura de Rotas

```
/{slug}/dashboard/sites/                       — listagem de sites
/{slug}/dashboard/sites/{siteId}/pages         — páginas do site
/{slug}/dashboard/sites/{siteId}/pages/{id}/builder  — schema editor
/{slug}/dashboard/sites/{siteId}/pages/{id}/edit     — split-pane (form + iframe)
/{slug}/dashboard/sites/{siteId}/analytics     — resultados
/{slug}/dashboard/sites/{siteId}/blog/         — blog do projeto
/{slug}/dashboard/landing-pages/               — mesma estrutura
```

## API Pública

```
GET /api/v1/content/{companySlug}/{projectId}/{pageSlug}  — conteúdo da página
```

## Para usar este módulo, você deve saber

- [ ] `createProject` cria automaticamente uma página "Home" com slug "/"
- [ ] Soft delete: `deletedAt` + `deletedBy` + `deletionReason`; filtrar com `deletedAt: null`
- [ ] `schemaData` = schema do CMS headless (definição de campos)
- [ ] `contentData` = valores preenchidos pelo usuário
- [ ] `content` = legado (editor antigo, formato livre)
- [ ] `previewUrl` em Project = URL base do site para preview no iframe
- [ ] `previewUrl` em Page = override por página (opcional)
- [ ] Slug de página deve ser único dentro do projeto (constraint `projectId_slug`)
- [ ] `blogEnabled` e `cmsEnabled` controlam features por projeto
- [ ] `cmsSyncScriptUrl` = URL do script de sincronização gerado para o front
