# 🚀 Modo Avançado (JSON Livre) — Fluxo Completo

## Visão Geral

**Ativado quando**: `Page.isAdvanced = true`  
**Dados em**: `Page.schemaData` (JSON livre — estrutura + conteúdo juntos)  
**UI Schema em**: `Page.uiSchema` (configuração de interface — nunca vai para API pública)  
**Editor**: Monaco (centro) + Painel Seções (lateral) + DynamicFieldRenderer (lateral)

```
┌──────────────────────────────────────────────────────────────────┐
│  SchemaBuilderEditor (isAdvancedMode=true)                       │
├──────────────────────┬────────────────────┬──────────────────────┤
│                      │                    │                      │
│  AdvancedJsonEditor  │  Seções (sidebar)  │  DynamicFieldRenderer│
│  ├── aba Dados       │  ← de uiSchema /   │  (campos da seção    │
│  │   (schemaData)    │    localData.keys  │   selecionada)       │
│  └── aba Interface   │                    │                      │
│      (uiSchema)      │                    │                      │
│                      │                    │                      │
└──────────────────────┴────────────────────┴──────────────────────┘
```

---

## Estrutura de Dados no DB

```
Page.schemaData  ← JSON livre completo (o que a API pública entrega)
Page.uiSchema    ← Configuração de interface (labels, tipos, ocultação)
Page.contentData ← IGNORADO no modo avançado (pertence ao modo legado)
```

### Formato Esperado do `schemaData`

O JSON livre deve ter `content` como chave de topo para que a navegação por seções funcione:

```json
{
  "name": "Home",
  "slug": "home",
  "content": {
    "hero-section": {
      "slides": [{ "headline": "...", "mediaUrl": "..." }]
    },
    "faq": {
      "items": [{ "question": "...", "answer": "..." }]
    }
  }
}
```

> **Por quê `content.*`?** O UI Schema usa `content.` como prefixo nas chaves (ex: `"content.faq"`) para refletir o caminho real dentro do JSON. `getDeep(localData, ["content", "faq"])` navega corretamente.

---

## UI Schema — Formato e Resolução

### O que é

O `uiSchema` é um JSON separado (salvo em `Page.uiSchema`) que descreve **como renderizar** cada campo — labels, tipos de input, campos ocultos. Nunca faz parte do payload da API pública.

### Regra fundamental: as chaves espelham o JSON de dados

**Não existe prefixo obrigatório.** A chave no UI Schema é o caminho exato para o campo no JSON de dados. Se o seu JSON é `{ "equipe": { "cards": [{ "nome": "" }] } }`, as chaves são:

```json
{
  "equipe": { "ui:label": "👥 Equipe" },
  "equipe.cards.*.nome": { "ui:label": "Nome" }
}
```

Se o JSON fosse `{ "content": { "equipe": { ... } } }`, as chaves seriam `"content.equipe"` e `"content.equipe.cards.*.nome"`. O prefixo nasce da estrutura dos dados — não é imposto pelo sistema.

### Formato Flat (Canônico)

Chaves são dot-paths que refletem o caminho no JSON de dados:

```json
{
  "faq": { "ui:label": "FAQ" },
  "faq.items": { "ui:label": "Perguntas" },
  "faq.items.*.question": { "ui:label": "Pergunta" },
  "faq.items.*.answer": { "ui:label": "Resposta", "ui:widget": "textarea" },
  "faq.items.*.image": { "ui:label": "Imagem", "ui:widget": "image" },

  "hero": { "ui:label": "Hero Section" },
  "hero.slides": { "ui:label": "Slides" },
  "hero.slides.*.headline": { "ui:label": "Headline" },
  "hero.slides.*.mediaUrl": { "ui:label": "URL da mídia", "ui:widget": "video" }
}
```

**Este é o formato que o `resolveUiConfig` lê diretamente.**

### Formato Nested (Alternativo, Normalizado Automaticamente)

Aceito pelo editor; convertido para flat em runtime pelo `effectiveUiSchema` (sem adicionar nenhum prefixo):

```json
{
  "faq": {
    "ui:label": "FAQ",
    "items": {
      "ui:label": "Perguntas",
      "items.*.question": { "ui:label": "Pergunta" },
      "items.*.answer": { "ui:label": "Resposta", "ui:widget": "textarea" }
    }
  }
}
```

### Propriedades Suportadas

| Propriedade | Valores | Efeito |
|---|---|---|
| `ui:label` | string | Substitui a chave crua como label do campo |
| `ui:widget` | ver tabela abaixo | Sobrescreve a heurística de tipo |
| `ui:description` | string | Texto auxiliar abaixo do campo |
| `ui:group` | string | Agrupa campos visualmente (cosmético) |
| `ui:color` | `"#hex"` | Pinta a borda esquerda do campo com a cor; no object collapsible, colore título e borda |
| `ui:size` | `"sm"` \| `"md"` \| `"lg"` \| `"xl"` | Altura mínima de textareas — sm=48px, md=80px (padrão), lg=160px, xl=280px |
| `ui:placeholder` | string | Substitui o placeholder automático em inputs de texto, textarea e url |

### Valores de `ui:widget`

| Valor | Renderiza |
|---|---|
| `text` | Input texto simples |
| `textarea` | Área de texto grande |
| `image` | Botão de upload de imagem |
| `video` | Botão de upload de vídeo |
| `url` | Input com validação de URL |
| `color` | Color picker |
| `boolean` | Switch toggle |
| `number` | Input numérico |
| `icon` | IconPicker (seletor visual Lucide) |
| `hidden` | Campo ocultado no painel (dado preservado no JSON) |

### Resolução de Caminho (`resolveUiConfig`)

**Localização**: `src/components/cms/DynamicFieldRenderer.tsx`

Prioridade decrescente:
1. **Exato**: `"content.faq.items.0.question"` → busca literal
2. **Wildcard**: `"content.faq.items.*.question"` → troca `/\.\d+\./g` por `".*."` 
3. **Array-raiz**: `"*.question"` → quando path começa com índice

---

## Fluxo de Renderização de Seções

### 1. Derivação de Seções (`uiSchemaSections`)

```typescript
// effectiveUiSchema é o uiSchema normalizado (flat, com content. prefix)
const uiSchemaSections = Object.keys(effectiveUiSchema).filter(key => {
  const config = effectiveUiSchema[key]
  if (typeof config !== 'object' || !config['ui:label']) return false
  if (key.includes('*')) return false
  // Só raízes: exclui filhos cujo pai também tem ui:label
  return !Object.keys(effectiveUiSchema).some(
    other => other !== key && key.startsWith(other + '.') && effectiveUiSchema[other]?.['ui:label']
  )
})

// Fallback: sem UI Schema → chaves de localData
const sections = uiSchemaSections.length > 0 ? uiSchemaSections : Object.keys(localData)
```

As seções no sidebar são os **dot-paths** das raízes com `ui:label`. Exemplo: `"content.faq"`, `"content.hero"`.

### 2. Navegação e Renderização

Ao clicar numa seção `"content.faq"`:

```typescript
// Buscar dados
const value = getDeep(localData, ["content", "faq"])
// → localData.content.faq

// Renderizar campos
<DynamicFieldRenderer
  dataKey="content.faq"
  value={value}
  path={["content", "faq"]}
  uiSchema={effectiveUiSchema}
  inline       // ← pula o wrapper collapsible do object raiz
  onChange={handleFieldChange}
/>
```

### 3. `getDeep` — Leitura Aninhada

```typescript
function getDeep(obj: Record<string, unknown>, path: string[]): unknown {
  let curr: unknown = obj
  for (const key of path) {
    if (curr === null || typeof curr !== 'object') return undefined
    curr = (curr as Record<string, unknown>)[key]
  }
  return curr
}
```

### 4. Propagação de Mudanças

Campo editado → `handleFieldChange(path, value)` → `setDeep(localData, path, value)` → `setLocalData` + `advancedSchemaRef.current` atualizado.

O `path` passado ao DFR é o caminho completo desde a raiz do `localData` (ex: `["content", "faq", "items", "0", "question"]`).

---

## Normalização de UI Schema Nested → Flat

**Localização**: `SchemaBuilderEditor.tsx` (funções `isNestedUiSchema`, `processNode`, `normalizeNestedUiSchema`)

```typescript
// Detecta: se nenhuma chave tem '.' ou começa com 'ui:' → é nested
function isNestedUiSchema(schema): boolean

// Converte nested para flat com prefixo content.
function normalizeNestedUiSchema(nested): Record<string, unknown>

// Aplicado via useMemo (não muta o estado do Monaco)
const effectiveUiSchema = useMemo(
  () => isNestedUiSchema(uiSchemaState) ? normalizeNestedUiSchema(uiSchemaState) : uiSchemaState,
  [uiSchemaState]
)
```

**Importante**: `uiSchemaState` (estado bruto, preservado no Monaco) é sempre salvo no DB. `effectiveUiSchema` é apenas para renderização — nunca persiste.

---

## Heurística de Tipo (Fallback sem UI Schema)

Quando não há `ui:widget` definido, `DynamicFieldRenderer.inferType()` decide o widget:

```
CHAVE (case-insensitive)     VALOR EXEMPLO         → WIDGET
──────────────────────────────────────────────────────────────
link, url, href, destino     "https://..."         → url
color / valor "#..."         "#FF0000"             → color
video / .mp4/.webm           "vid.mp4"             → video
image/img/bg/logo/src/...    "img.png"             → image
icon                         "ArrowRight"          → icon picker
paragraph/paragrafo (array)  ["p1", "p2"]          → paragraphs
cta/button/botao (object)    { text, href }        → cta grid
desc/text/body/>50 chars     "longa string..."     → textarea
boolean                      true / false          → switch
number                       123                   → number input
──────────────────────────────────────────────────────────────
(default)                    qualquer              → text input
```

---

## `setDeep` — Mutação Imutável

```typescript
function setDeep(obj, path, value) {
  const clone = structuredClone(obj)  // 1. Deep copy
  let curr = clone
  for (let i = 0; i < path.length - 1; i++) {
    // navega criando estrutura intermediária se necessário
    curr = curr[path[i]]
  }
  curr[path[path.length - 1]] = value  // 2. Atualiza folha
  return clone                          // 3. Nova referência
}
```

---

## Persistência (Save)

```typescript
handleSaveContent() → updatePageAdvancedData({
  pageId,
  schemaJson: JSON.stringify(advancedSchemaRef.current),  // localData completo
  uiSchemaJson: JSON.stringify(uiSchemaRef.current),       // uiSchema bruto (não normalizado)
})
```

**Server Action** faz full-replace em ambos os campos atomicamente.

---

## Diferenças: Builder vs Edit Page

| Aspecto | Builder (`/builder`) | Edit (`/edit`) |
|---|---|---|
| `isDevMode` | `true` | `false` |
| Monaco | SIM (AdvancedJsonEditor) | NÃO |
| Edição UI Schema | SIM (aba Interface) | NÃO (read-only) |
| Seções sidebar | SIM | SIM |
| DFR campos | SIM | SIM |
| Save destino | `updatePageAdvancedData` | `updatePageSchema` |
| Preview | Seções + campos side by side | Iframe em tempo real |

---

## Exemplo Completo de UI Schema (Flat, Canônico)

Todas as propriedades disponíveis demonstradas em conjunto:

```json
{
  "content.faq": {
    "ui:label": "❓ FAQ",
    "ui:color": "#6366f1"
  },
  "content.faq.items": { "ui:label": "Perguntas" },
  "content.faq.items.*.question": {
    "ui:label": "Pergunta",
    "ui:placeholder": "Ex: Como funciona o serviço?",
    "ui:color": "#6366f1"
  },
  "content.faq.items.*.answer": {
    "ui:label": "Resposta",
    "ui:widget": "textarea",
    "ui:size": "lg",
    "ui:description": "Seja objetivo. Máximo de 3 linhas."
  },
  "content.faq.items.*.image": {
    "ui:label": "Imagem ilustrativa",
    "ui:widget": "image"
  },

  "content.hero": { "ui:label": "🦸 Hero Section" },
  "content.hero.slides": { "ui:label": "Slides" },
  "content.hero.slides.*.headline": {
    "ui:label": "Headline",
    "ui:placeholder": "Ex: A solução que a sua empresa precisa"
  },
  "content.hero.slides.*.description": {
    "ui:label": "Descrição",
    "ui:widget": "textarea",
    "ui:size": "md"
  },
  "content.hero.slides.*.mediaUrl": {
    "ui:label": "Vídeo / Imagem de fundo",
    "ui:widget": "video"
  },
  "content.hero.slides.*.primaryButtonText": { "ui:label": "Texto do botão" },
  "content.hero.slides.*.primaryButtonLink": {
    "ui:label": "Link do botão",
    "ui:widget": "url",
    "ui:color": "#ef4444"
  },

  "content.theme": {
    "ui:label": "🎨 Tema",
    "ui:color": "#f59e0b"
  },
  "content.theme.primary_color": {
    "ui:label": "Cor principal",
    "ui:widget": "color"
  },
  "content.theme.internal_id": {
    "ui:widget": "hidden"
  }
}
```

> **Regra de ouro**: toda chave começa com `content.` + `<section-key>`. Arrays usam `*` como índice coringa. Objetos aninhados usam dot notation progressivo. Propriedades visuais (`ui:color`, `ui:size`, `ui:placeholder`) podem ser combinadas livremente com `ui:label` e `ui:widget`.

---

## Ver também

- `rules.md` — Proibições e obrigações arquiteturais
- `data-model.md` — Campos do model Page no Prisma
- `data-isolation.md` — Por que `contentData` e `schemaData` nunca se misturam
- `changelog.md` — Histórico de alterações
