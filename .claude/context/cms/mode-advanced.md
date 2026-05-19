# 🚀 Modo Avançado (Tegbe) — Fluxo Completo

## Visão Geral

**Ativado quando**: `Page.isAdvanced = true`  
**Dados em**: `Page.contentData` (JSON livre)  
**Editor**: Monaco (esquerda) + Form Fields com heurística (direita)

```
┌─────────────────────────────────────────┐
│  SchemaBuilderEditor (isAdvancedMode)   │
├────────────────┬────────────────────────┤
│                │                        │
│  Monaco JSON   │  DynamicFieldRenderer  │
│  (contentData) │  (heurística + form)   │
│                │                        │
├────────────────┼────────────────────────┤
│  Templates     │  Botão Save (header)   │
└────────────────┴────────────────────────┘
```

---

## Fluxo de Dados

### 1️⃣ Edição (Monaco)

Usuário digita JSON no Monaco:
```typescript
handleRawJsonChange(jsonString) {
  setRawJson(jsonString)
  try {
    const parsed = JSON.parse(jsonString)
    setLocalData(parsed)           // ← State atualizado
    setIsJsonValid(true)
    fireReplace(parsed)            // ← Debounced 400ms
    onDataChange?.(parsed)         // ← Não debounced
  } catch {
    setIsJsonValid(false)
  }
}
```

### 2️⃣ Edição (Form Fields)

Usuário clica em input, DynamicFieldRenderer muda:
```typescript
handleFieldChange(path, value) {
  setLocalData((prev) => {
    const next = setDeep(prev, path, value)  // ← structuredClone
    fireReplace(next)                        // ← 400ms delay
    onDataChange?.(next)                     // ← Imediato
    return next
  })
}
```

### 3️⃣ Preview em Tempo Real

`fireReplace()` envia para iframe com debounce:
```typescript
iframe.contentWindow.postMessage(
  { type: 'janus:content-update', contentData: data },
  '*'
)
```

### 4️⃣ Rastreamento de Latest Data

`onDataChange` callback (sem debounce) atualiza ref no parent:
```typescript
// Em SchemaBuilderEditor
const contentDataRef = useRef<Record<string, unknown>>()
// Passa para AdvancedJsonEditor:
<AdvancedJsonEditor onDataChange={(d) => { contentDataRef.current = d }} />
```

### 5️⃣ Persistência (Save Button)

User clica "Salvar" no header:
```typescript
handleSaveContent() {
  startTransition(async () => {
    const result = await updatePageContentData({
      pageId,
      contentData: contentDataRef.current,  // ← Latest data
    })
    // ... feedback ...
  })
}
```

**Server Action** faz:
```typescript
const safeData = JSON.parse(JSON.stringify(contentData))  // ← Full replace
await db.page.update({ contentData: safeData })
revalidatePath('/${company}/dashboard', 'layout')
```

### 6️⃣ Revalidação + Reload

Cache é invalidado, próximo F5 carrega dados freshes do DB.

---

## Heurística de Tipo (Type Inference)

**Localização**: `DynamicFieldRenderer.inferType()`

Padrão matching na chave (case-insensitive) + análise de valor:

```
NOME DA CHAVE              VALOR EXEMPLO      → TIPO
─────────────────────────────────────────────────────
link, url, href            "https://..."      → url (cyan)
color, starts with #       "#FF0000"          → color picker
video, .mp4/.webm          "vid.mp4"          → upload video
image, img, bg, .png/.jpg  "img.png"          → upload image
icon                       "star"             → icon selector
paragraph, paragrafo       ["p1", "p2"]       → paragraphs array
cta, button, botao         {text, href}       → cta grid
desc, text, body, >50 chr  "long string..."   → textarea
boolean type               true/false         → switch
number type                123                → input number
─────────────────────────────────────────────────────
(default)                  "qualquer"         → text input
```

---

## Função setDeep() — Mutação Imutável

Atualiza valor aninhado sem gambiarra:

```typescript
function setDeep(
  obj: Record<string, unknown>,
  path: string[],    // e.g., ['hero', 'cta', 'text']
  value: unknown,
): Record<string, unknown> {
  const clone = structuredClone(obj)  // 1. Deep copy
  
  let current: Record<string, unknown> | unknown[] = clone
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    const nextKey = path[i + 1]
    const isNextIndex = /^\d+$/.test(nextKey)
    
    if (Array.isArray(current)) {
      const idx = parseInt(key, 10)
      if (current[idx] === undefined) {
        current[idx] = isNextIndex ? [] : {}
      }
      current = current[idx]
    } else {
      if (!current[key]) {
        current[key] = isNextIndex ? [] : {}
      }
      current = current[key]
    }
  }
  
  // 2. Atualizar a folha
  const lastKey = path[path.length - 1]
  if (Array.isArray(current)) {
    current[parseInt(lastKey, 10)] = value
  } else {
    current[lastKey] = value
  }
  
  return clone  // 3. Nova referência (React detecta)
}
```

**Garantias**:
- ✅ Sem referência compartilhada (imutável)
- ✅ Cria estrutura intermediária se needed
- ✅ Diferencia array (índice) de objeto (chave)
- ✅ React re-render acionado

---

## Templates Embutidos

Fórmulas pré-construídas (botões em footer):

```typescript
[
  { label: 'Nova Seção', template: { title: '', subtitle: '', backgroundImage: '', active: true } },
  { label: 'Lista', template: { items: [{ title: '', description: '', imageUrl: '' }] } },
  { label: 'Parágrafos', template: { paragraphs: ['', ''] } },
  { label: 'CTA', template: { cta: { text: 'Saiba Mais', href: '/', icon: '' } } },
  { label: 'Hero', template: { title: '', subtitle: '', backgroundImage: '', cta: {...}, active: true } },
]
```

Click → `handleInjectTemplate()` → merge com `localData` → atualiza Monaco + form.

---

## Diferenças: Builder vs Edit Page

| Aspecto | Builder | Edit |
|---------|---------|------|
| `isDevMode` | `true` | `false` |
| Monaco | SIM (2/5) | NÃO |
| Form Fields | SIM (3/5) | SIM (full) |
| Templates | SIM (footer) | NÃO |
| Save Button | Header "Salvar" | Footer "Salvar" |
| Escopo | Schema + Content | Content only |

---

## Callbacks Não-Debounced vs Debounced

| Callback | Debounce | Uso |
|----------|----------|-----|
| `onDataChange` | NÃO | Rastrear latest para save |
| `fireReplace` | 400ms | Preview em iframe (evita flood) |
| `onReplaceData` | 400ms | Notificar parent (preview) |

---

## Ver também

- `type-inference.md` — Árvore detalhada de decisão
- `mutations.md` — Mais exemplos de setDeep
- `server-actions.md` — Implementação completa da action
- `../../quick-ref/patterns.md` — Copy-paste código
