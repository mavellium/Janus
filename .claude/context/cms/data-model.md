# 💾 Modelo de Dados (Prisma Page)

## Page Model

```prisma
model Page {
  id           String    @id @default(uuid())
  projectId    String
  project      Project   @relation(...)
  
  name         String
  slug         String
  
  -- MODO LEGADO
  content      Json?     @default("{}")        -- Deprecated
  schemaData   Json?     @default("{}")        -- Schema (form definition)
  
  -- MODO AVANÇADO
  contentData  Json?     @default("{}")        -- JSON Livre (Tegbe)
  
  -- CONTROLE
  isAdvanced   Boolean   @default(false)       -- Qual renderizar?
  
  -- META
  previewUrl   String?
  isPublished  Boolean   @default(false)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?  -- Soft delete
  
  @@unique([projectId, slug])
  @@index([projectId])
  @@index([deletedAt])
}
```

---

## Semântica dos Campos

### `schemaData: Json`
**Responsável**: Developer (ao definir formulário)  
**Quando usado**: Modo Legado (`isAdvanced=false`)  
**Estrutura**:
```json
[
  {
    "id": "sec-hero",
    "name": "Hero",
    "fields": [
      { "name": "title", "label": "Título", "type": "text" },
      { "name": "subtitle", "label": "Subtítulo", "type": "text" }
    ]
  }
]
```
**Ferramenta**: SchemaBuilderEditor (modo schema, Monaco)  
**Persistência**: `updatePageSchema` action

---

### `contentData: Json`
**Responsável**: Usuário / Developer  
**Quando usado**: Modo Avançado (`isAdvanced=true`)  
**Estrutura**: LIVRE (qualquer JSON válido)  
```json
{
  "heroTitle": "Bem-vindo",
  "heroSubtitle": "Ao melhor CMS",
  "sections": [
    { "id": "s1", "title": "Seção 1" },
    { "id": "s2", "title": "Seção 2" }
  ],
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#1F2937"
  }
}
```
**Ferramenta**: AdvancedJsonEditor (Monaco + form fields)  
**Persistência**: `updatePageContentData` action  
**Garantia**: Full-replace (não merge) ao salvar

---

### `isAdvanced: Boolean`
**Default**: `false` (Modo Legado)  
**Muta via**: `updatePageMode` action  
**Efeito**: Determina como a página é renderizada (edit + builder)  
**Uso**:
```typescript
const page = await db.page.findUnique(...)
if (page.isAdvanced) {
  // Renderizar com contentData
  return <AdvancedJsonEditor data={page.contentData} />
} else {
  // Renderizar com schemaData
  return <DynamicForm schemaData={page.schemaData} />
}
```

---

## Campos Relacionados (Não Tocar)

| Campo | Razão |
|-------|-------|
| `content` | Deprecated (legado pré-refactor) |
| `slug` | Read-only (único por projeto) |
| `deletedAt` | Soft delete (sempre filtrar NULL) |
| `previewUrl` | De leitura (projeto pode sobrescrever) |

---

## Invariantes

**Invariante 1**: Se `isAdvanced=true`, use `contentData`, ignore `schemaData`  
**Invariante 2**: Se `isAdvanced=false`, use `schemaData`, ignore `contentData`  
**Invariante 3**: Sempre filtrar `deletedAt: null` em queries  
**Invariante 4**: `contentData` é full-replaced, nunca merged

---

## Query Patterns

### Carregar para Edição
```typescript
const page = await db.page.findUnique({
  where: { id: pageId, projectId: siteId, deletedAt: null },
  select: {
    id: true,
    name: true,
    schemaData: true,
    contentData: true,
    isAdvanced: true,  // ← Ler flag
  }
})

if (page.isAdvanced) {
  return <AdvancedJsonEditor initialData={page.contentData} />
} else {
  return <DynamicForm schemaData={page.schemaData} />
}
```

### Atualizar Modo
```typescript
await db.page.update({
  where: { id: pageId },
  data: { isAdvanced: true }  // ← Toggle modo
})
```

### Atualizar Conteúdo
```typescript
const safeData = JSON.parse(JSON.stringify(newData))
await db.page.update({
  where: { id: pageId },
  data: { contentData: safeData }  // ← Full replace
})
```

---

## Ver também
- `mode-legacy.md` — Como `schemaData` é usado
- `mode-advanced.md` — Como `contentData` é usado
- `../../quick-ref/patterns.md` — Query examples
