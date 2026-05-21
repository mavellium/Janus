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
- `schemaData: Json` → Define formulário (legado) / JSON de dados em modo avançado
- `contentData: Json` → Dados livres (avançado — não usado no flow atual)
- `uiSchema: Json` → Configuração de UI separada (labels, tipos, ocultar campos)
- `isAdvanced: boolean` → Qual modo renderizar

**UI Schema** (Modo Avançado):
- Salvo no campo `uiSchema` — nunca vai para o payload da API pública
- Formato: `{ "hero.title": { "ui:label": "Título", "ui:widget": "textarea" } }`
- Resolução por dot notation: exato → wildcard (`cards.*.nome`) → sem índice (`cards.nome`)
- Props suportadas: `ui:label`, `ui:description`, `ui:widget`, `ui:group`
- `ui:widget: "hidden"` oculta o campo no painel sem remover do JSON de dados

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
- UI Schema? → `changelog.md` (entry 2026-05-20)
- Segurança de dados? → `data-isolation.md` ⭐ Como modos não se sobrescrevem
- Copy-paste pattern? → `../../quick-ref/patterns.md`
