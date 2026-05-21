# Data Isolation: Modo Legado vs Modo Avançado

**Objetivo**: Garantir que cada modo tenha seu próprio espaço de dados, sem sobrescita acidental ou perda de dados.

---

## 📊 Arquitetura de Armazenamento

### Page Model (Prisma)

| Campo | Legado | Avançado |
|-------|--------|----------|
| `schemaData` | Definição de campos (schema fixo) | **Dados JSON livres** |
| `contentData` | **Valores preenchidos pelos usuários** | NÃO USADO (vazio) |
| `uiSchema` | Configuração de rótulos/tipos UI | Configuração de rótulos/tipos UI |
| `isAdvanced` | `false` | `true` |

---

## 🔄 Fluxo de Salvamento - ISOLADO

### Modo Legado (`isAdvanced = false`)

```
DynamicForm carrega:
  - schemaData (estrutura dos campos)
  - contentData (valores preenchidos)
    ↓
Usuário edita valores
    ↓
handleSave → updatePageContentData()
    ↓
DB: contentData ← valores do formulário
    schemaData ← INTACTO (não alterado)
```

### Modo Avançado (`isAdvanced = true`)

```
SiteContentEditClient carrega:
  - schemaData (dados JSON livres)
  - contentData ← IGNORADO
    ↓
Usuário edita JSON (3 colunas)
    ↓
handleSave → updatePageSchema()
    ↓
DB: schemaData ← dados JSON editados
    contentData ← INTACTO (não alterado)
```

---

## ✅ Garantias de Segurança

### 1. **Isolamento Total**
- Legado **SEMPRE** escreve em `contentData`
- Avançado **SEMPRE** escreve em `schemaData`
- Nunca compartilham o mesmo campo de salvamento

### 2. **Sem Sobrescita Acidental**
```
Usuário em modo LEGADO edita: contentData
Muda para modo AVANÇADO: contentData fica intacto, carrega schemaData
Usuário em modo AVANÇADO edita: schemaData
Muda para modo LEGADO: schemaData fica intacto, carrega contentData
```

### 3. **Campo Vazio = Modo Novo**
- Se `contentData` está vazio → modo legado mostra formulário vazio
- Se `schemaData` está vazio → modo avançado mostra editor vazio
- Cada um vê apenas seu próprio espaço

---

## 🚨 Casos de Uso Críticos

### Caso 1: Criar página em modo legado
```json
Page {
  isAdvanced: false,
  schemaData: { hero: {...}, cards: {...} },  // SCHEMA
  contentData: { hero: "Título", cards: [...] },  // VALORES PREENCHIDOS
  uiSchema: {}
}
```

### Caso 2: Dev muda para avançado (SEM EDITAR)
```json
Page {
  isAdvanced: true,
  schemaData: { hero: {...}, cards: {...} },  // Tenta carregar como dados
  contentData: { hero: "Título", cards: [...] },  // ← IGNORADO!
  uiSchema: {}
}
// ⚠️ Problema: schemaData é schema, não dados!
```

### Caso 3: Dev deve criar nova página em modo avançado
```json
Page {
  isAdvanced: true,
  schemaData: { hero: { title: "...", description: "..." } },  // DADOS JSON
  contentData: {},  // Vazio, não usado
  uiSchema: {}
}
```

### Caso 4: Alterna de avançado para legado (SEM EDITAR LEGADO)
```json
Page {
  isAdvanced: false,
  schemaData: { hero: {...}, cards: {...} },  // SCHEMA original
  contentData: { hero: "Título", cards: [...] },  // VALORES originais
  uiSchema: {}
}
// ✅ Tudo intacto!
```

---

## 📝 Regras Absolutas

### Modo Legado
- ✅ Lê de: `schemaData` (schema) + `contentData` (valores)
- ✅ Escreve em: `contentData` APENAS
- ❌ NUNCA toca em `schemaData`
- ❌ NUNCA entra em modo avançado se não tiver schema

### Modo Avançado
- ✅ Lê de: `schemaData` (dados JSON) — ignora `contentData`
- ✅ Escreve em: `schemaData` APENAS
- ❌ NUNCA toca em `contentData`
- ✅ Pode estar com `contentData` vazio

### Alternância de Modo
- Via `updatePageMode()`: APENAS muda flag `isAdvanced`
- NÃO altera dados
- NÃO copia entre campos

---

## 📊 Tabela de Ações

| Modo | Editor | Carrega De | Escreve Em | Action |
|------|--------|-----------|-----------|--------|
| **Legado** | DynamicForm | schemaData + contentData | contentData | `updatePageContentData` |
| **Avançado** | 3-Colunas | schemaData APENAS | schemaData | `updatePageSchema` |
| **Builder** | Monaco | schemaData | schemaData | `updatePageSchema` |
| **Switch** | UI Flag | - | isAdvanced APENAS | `updatePageMode` |

---

## 🚀 Garantia Final

**Invariante**: `contentData` do modo legado NUNCA é sobrescrito por modo avançado, e vice-versa.

Cada modo tem seu próprio espaço garantido:
- Legado: `contentData` (valores) + `schemaData` (schema)
- Avançado: `schemaData` (dados) — `contentData` é ignorado

Resultado: **Sem perda de dados, sem sobrescita, sem confusão.**
