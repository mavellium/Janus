# 🔒 Regras Arquiteturais Absolutas

## ❌ PROIBIÇÕES (Nunca Faça)

### 1. localStorage para Estado de UI
```typescript
// ❌ NUNCA
const [mode, setMode] = useState(() => localStorage.getItem('mode'))

// ✅ SEMPRE
const page = await db.page.findUnique(...)
const [mode, setMode] = useState(page.isAdvanced)
```
**Razão**: localStorage persiste entre usuários/contextos. Quebra coexistência de modos.

---

### 2. Deep-Merge ao Salvar contentData
```typescript
// ❌ NUNCA
const merged = deepMerge(existing, newData)
await db.page.update({ contentData: merged })

// ✅ SEMPRE
const safeData = JSON.parse(JSON.stringify(newData))
await db.page.update({ contentData: safeData })
```
**Razão**: User deleta chave X; deep-merge revive X. Dados fantasma aparecem.

---

### 3. Mutação Direta de Objetos
```typescript
// ❌ NUNCA
contentData.hero.title = 'novo'  // Mutação direta
setLocalData(contentData)

// ✅ SEMPRE
const next = setDeep(localData, ['hero', 'title'], 'novo')
setLocalData(next)
```
**Razão**: Quebra reatividade React. Sem referência nova, não detecta mudança.

---

### 4. Lógica de Modo no Cliente
```typescript
// ❌ NUNCA (bad sync)
if (user.isDeveloper) {
  setIsAdvanced(true)  // Cliente decide
}

// ✅ SEMPRE (single source of truth)
const page = await db.page.findUnique(...)
const [isAdvanced] = useState(page.isAdvanced)  // Lido do DB
```
**Razão**: Descincroniza UI com estado persistido. Modo não sincroniza.

---

## ✅ OBRIGAÇÕES (Sempre Faça)

### 1. structuredClone + setDeep para Updates
```typescript
function setDeep(obj, path, value) {
  const clone = structuredClone(obj)  // Deep copy
  // ... navigate path, update value ...
  return clone  // Nova referência
}
```
**Quando**: Toda atualização de objeto aninhado.

---

### 2. revalidatePath Após Mutation
```typescript
await db.page.update({ contentData: safeData })
revalidatePath(`/${company.slug}/dashboard`, 'layout')  // ← Obrigatório
return { ok: true }
```
**Quando**: Toda Server Action que muta banco.

---

### 3. unstable_noStore em Pages que Leem isAdvanced
```typescript
export default async function BuilderPage() {
  unstable_noStore()  // ← Obrigatório
  const page = await db.page.findUnique(...)
  return <SchemaBuilderEditor initialIsAdvanced={page.isAdvanced} />
}
```
**Quando**: Page.tsx que renderiza builder ou edit.

---

### 4. Validar JSON Antes de Persistir
```typescript
let parsed: unknown
try {
  parsed = JSON.parse(jsonString)
} catch {
  return { ok: false, error: 'JSON inválido' }  // ← Rejeitar
}
await db.page.update({ schemaData: parsed })
```
**Quando**: updatePageSchema, ou qualquer save de JSON.

---

### 5. Access Control em Mutations
```typescript
if (
  session.user.companySlug &&
  page.project.company.slug !== session.user.companySlug &&
  session.user.role !== 'ADMIN'
) {
  return { ok: false, error: 'Acesso negado' }
}
```
**Quando**: Toda Server Action que modifica banco.

---

## 📋 Checklist Rápido

Antes de fazer commit:
- [ ] Nenhum `localStorage` foi usado
- [ ] Nenhum deep-merge ou mutação direta
- [ ] Toda mutation tem `revalidatePath()`
- [ ] Pages que leem `isAdvanced` têm `unstable_noStore()`
- [ ] JSON foi validado com try/catch
- [ ] Access control está em lugar
- [ ] Changelog foi atualizado
