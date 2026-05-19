# 📘 Visão Geral da Arquitetura

## O Problema: Dois Padrões em Um CMS

O Janus CMS precisa suportar:
1. **Modo Legado**: Blocos estruturados (como era antes)
2. **Modo Avançado**: JSON livre (novo, sem limite de estrutura)

Ambos vivem no **mesmo banco**, mesma page, mesma interface.

---

## A Solução: Flag + Coexistência

### Page Model (Prisma)
```
Page {
  schemaData: Json         ← Schema do formulário (legado)
  contentData: Json        ← JSON livre (avançado)
  isAdvanced: boolean      ← QUAL modo renderizar
}
```

### Fluxo de Renderização

```
┌─ Carregar Page do DB
├─ Ler: Page.isAdvanced
├─ if isAdvanced=true  → usar contentData (Modo Avançado)
└─ if isAdvanced=false → usar schemaData (Modo Legado)
```

---

## Componentes Principais

| Componente | Responsável | Arquivo |
|---|---|---|
| `SchemaBuilderEditor` | Escolher modo + editar | schema-builder/ |
| `AdvancedJsonEditor` | Editar JSON + form | cms/ |
| `DynamicFormRenderer` | Renderizar form legado | cms/ |
| `DynamicFieldRenderer` | Renderizar inputs com heurística | cms/ |
| `updatePageContentData` | Persistir contentData | actions/ |
| `updatePageSchema` | Persistir schemaData | actions/ |
| `updatePageMode` | Persistir isAdvanced flag | actions/ |

---

## Ciclo de Vida

### Novo Projeto
1. Dev cria página (padrão: `isAdvanced=false`)
2. Dev define schema em Monaco (Modo Legado)
3. Dev salva schema → `updatePageSchema`
4. Usuário preenche formulário

### Upgrade para Avançado
1. Dev ativa toggle "Modo Avançado (JSON Livre)"
2. Toggle chama `updatePageMode({ isAdvanced: true })`
3. Page.isAdvanced = true persiste
4. Edit page renderiza `AdvancedJsonEditor` em vez de `DynamicForm`

### Editar Modo Avançado
1. Dev edita JSON no Monaco ou form fields
2. Changes atualizam `localData` via `setDeep()`
3. Preview em iframe sincroniza (debounced 400ms)
4. Click "Salvar" → `updatePageContentData` persiste

---

## Heurística: Como Tipos São Inferidos

Sem schema pré-definido, o tipo de input é **inferido** do nome da chave:

```
{ imageUrl: 'pic.png' }     ← "imageUrl" → image upload
{ buttonLink: 'https://...' }  ← "Link" → URL input (cyan)
{ bgColor: '#FFF' }          ← "Color" → color picker
{ description: '...' }       ← long string → textarea
```

Veja `type-inference.md` para lista completa.

---

## Mutação Sem Gambiarra

Atualizar nested JSON em React requer cuidado:

```typescript
// ❌ Errado (mutação direta)
data.hero.title = 'novo'
setData(data)  // React não detecta

// ✅ Correto (deep clone + nova referência)
const next = setDeep(data, ['hero', 'title'], 'novo')
setData(next)  // React detecta mudança
```

Função `setDeep()` faz isso automaticamente (veja `mutations.md`).

---

## Persistência

Toda mutation (save) segue pattern:

```
1. Validar dados (JSON válido? Permissão ok?)
2. Fazer update no DB
3. Chamar revalidatePath() para invalidar cache
4. Retornar { ok, error? }
```

Exemplos em `../../quick-ref/patterns.md`.

---

## Regras Absolutas

**Nunca**:
- ❌ localStorage para estado
- ❌ deep-merge ao salvar
- ❌ mutação direta
- ❌ lógica de modo no cliente

**Sempre**:
- ✅ structuredClone para copy
- ✅ revalidatePath em mutations
- ✅ unstable_noStore em pages
- ✅ validar JSON + access control

Veja `rules.md` com exemplos práticos.

---

## Próximas Leituras

- Implementando nova feature? → `mode-advanced.md` (fluxo)
- Copy-paste código? → `../../quick-ref/patterns.md`
- Dúvida sobre regra? → `rules.md`
- Qual tipo de input para "X"? → `type-inference.md`
