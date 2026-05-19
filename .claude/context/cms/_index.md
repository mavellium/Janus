# CMS — Sumário Executivo

**O Janus CMS tem 2 modos que coexistem:**

| Aspecto | Modo Legado | Modo Avançado (Tegbe) |
|---------|-------------|----------------------|
| **Flag DB** | `isAdvanced=false` | `isAdvanced=true` |
| **Dados** | `schemaData` + formulário | `contentData` (JSON Livre) |
| **Editor** | Monaco schema + preview | Monaco JSON + form fields |
| **Tipo** | Estruturado (pré-definido) | Livre (heurística) |
| **Padrão** | ✅ Default | ❌ Opt-in |

---

## 🔑 Conceitos-Chave

**Page model** (Prisma):
- `schemaData: Json` → Define formulário (legado)
- `contentData: Json` → Dados livres (avançado)
- `isAdvanced: boolean` → Qual modo renderizar

**Heurística de tipo** (DynamicFieldRenderer):
- Nome da chave + valor → Tipo de input inferido
- Ex: `imageUrl` → input image, `color` → input color

**Mutação imutável** (setDeep):
- Usa `structuredClone()` para deep copy
- Navega path, atualiza folha, retorna nova referência
- Nunca mutação direta

---

## 🚫 Regras Absolutas

**Proibições**:
- ❌ Nunca localStorage (persiste entre usuários)
- ❌ Nunca deep-merge ao salvar contentData
- ❌ Nunca mutação direta de objeto
- ❌ Nunca lógica de modo no cliente

**Obrigações**:
- ✅ Sempre structuredClone + setDeep para updates
- ✅ Sempre revalidatePath após mutation
- ✅ Sempre unstable_noStore em pages que leem isAdvanced
- ✅ Sempre validar JSON antes de persistir

---

## 📚 Próximas Leituras

- Fluxo detalhado? → `mode-legacy.md` ou `mode-advanced.md`
- Implementar action? → `server-actions.md`
- Qual regra se aplica? → `rules.md`
- Copy-paste pattern? → `../../quick-ref/patterns.md`
