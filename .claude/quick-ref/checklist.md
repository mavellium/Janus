# ✅ Checklist Pré-Commit (CMS)

## Antes de fazer `git commit`

### Code Quality
- [ ] `pnpm format` passou
- [ ] `pnpm lint` passou
- [ ] `pnpm typecheck` passou
- [ ] Nenhum `console.log` de debug

### Arquitetura CMS
- [ ] Consultei `context/cms/rules.md` antes de código
- [ ] Nenhum `localStorage` foi adicionado
- [ ] Nenhum deep-merge ou mutação direta
- [ ] Cada Server Action tem `revalidatePath()`
- [ ] Page.tsx que lê `isAdvanced` tem `unstable_noStore()`

### Persistência
- [ ] JSON foi validado com try/catch (se aplicável)
- [ ] Access control está em lugar (se mutation)
- [ ] Dados são salvos como full-replace, não merge
- [ ] structuredClone + setDeep usado para updates

### Documentação
- [ ] `.claude/context/cms/changelog.md` foi atualizado com entry
  ```
  ### [YYYY-MM-DD] — Descrição breve
  **Arquivos**: ...
  **Razão**: ...
  **Impacto**: ...
  ```

## Se você editou...

### ✏️ Server Actions (`src/modules/projects/actions/*`)
- [ ] `revalidatePath()` presente
- [ ] Auth check (session.user.id)
- [ ] Access control check (company slug match)
- [ ] Try/catch com console.error
- [ ] Return `{ ok: true }` ou `{ ok: false, error: string }`

### ✏️ Page Server Components (`src/app/.../page.tsx`)
- [ ] `unstable_noStore()` no topo (se lê isAdvanced)
- [ ] `await params` (Next.js 16 pattern)
- [ ] Redirect checks para auth/permissions
- [ ] Select apenas campos necessários
- [ ] `deletedAt: null` filter

### ✏️ Componentes Client (`src/components/context/cms/*`)
- [ ] `'use client'` presente
- [ ] useState/useRef para local state
- [ ] useCallback com dependency array correto
- [ ] Nenhuma chamada a DB (só Server Actions)

### ✏️ Builder/Editor (`src/components/schema-builder/*`)
- [ ] isAdvanced toggle persiste via `updatePageMode`
- [ ] Botão Save contextual (header vs footer)
- [ ] onDataChange callback não-debounced
- [ ] onReplaceData callback debounced (400ms)

---

## Frase de Segurança

Antes de fazer push:

> ✅ Consultei `context/cms/rules.md`, segui patterns de `quick-ref/patterns.md`, e atualizei `context/cms/changelog.md`

