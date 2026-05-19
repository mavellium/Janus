# 📖 Glossário e Abreviações

## Termos do CMS

| Termo | Significado | Exemplo |
|-------|-------------|---------|
| **Modo Legado** | Padrão tradicional: schema pré-definido + formulário | Form com inputs estruturados |
| **Modo Avançado (Tegbe)** | JSON livre sem limitação de estrutura | { hero: {}, sections: [] } |
| **Schema** | Definição de formulário (campos, tipos, labels) | [{ name: 'title', type: 'text' }] |
| **contentData** | Dados salvos no modo avançado (JSON livre) | { heroTitle: '', sections: [...] } |
| **schemaData** | Definição de formulário (modo legado) | Array de sections com fields |
| **isAdvanced** | Flag no DB que determina qual modo renderizar | true ou false |
| **Heurística** | Algoritmo que infere tipo de input do nome da chave | `imageUrl` → image upload |
| **setDeep** | Função que atualiza valor aninhado sem mutação | `setDeep(obj, ['a', 'b'], value)` |
| **structuredClone** | Deep copy de objeto/array | `const clone = structuredClone(obj)` |
| **Callback** | Função passada como prop para notificar parent | `onDataChange(data)` |

---

## Abreviações

| Abreviação | Significa | Contexto |
|---|---|---|
| **CMS** | Content Management System | O Janus CMS |
| **Dev** | Developer / Desenvolvedor | Quem edita schema |
| **UI** | User Interface | Cliente final |
| **Server Action** | Função marcada com `'use server'` | updatePageSchema, etc |
| **Revalidate** | Invalidar cache do Next.js | revalidatePath() |
| **isAdvanced** | Flag de modo avançado | Page.isAdvanced |
| **Monaco** | Editor de código (JSON) | Na interface do builder |
| **Form Field** | Input visual renderizado dinamicamente | Gerado por DynamicFieldRenderer |
| **Action** | Server Action (mutação) | updatePageContentData |
| **Query** | Leitura de dados (read-only) | db.page.findUnique |

---

## Componentes (Alias)

| Nome Oficial | Alias | Arquivo |
|---|---|---|
| `AdvancedJsonEditor` | JSON Editor | `src/components/cms/AdvancedJsonEditor.tsx` |
| `DynamicFieldRenderer` | Field Renderer | `src/components/cms/DynamicFieldRenderer.tsx` |
| `DynamicForm` | Legacy Form | `src/components/cms/DynamicForm.tsx` |
| `SchemaBuilderEditor` | Builder | `src/components/schema-builder/SchemaBuilderEditor.tsx` |
| `SiteContentEditClient` | Edit Client | `src/components/schema-builder/SiteContentEditClient.tsx` |
| `LiveFormPreview` | Preview | `src/components/schema-builder/LiveFormPreview.tsx` |

---

## Regras (Quick Ref)

| Regra | Categoria |
|-------|-----------|
| Nunca localStorage | ❌ Proibição |
| Nunca deep-merge | ❌ Proibição |
| Nunca mutação direta | ❌ Proibição |
| Nunca lógica modo no cliente | ❌ Proibição |
| Sempre structuredClone | ✅ Obrigação |
| Sempre revalidatePath | ✅ Obrigação |
| Sempre unstable_noStore | ✅ Obrigação |
| Sempre validar JSON | ✅ Obrigação |
| Sempre access control | ✅ Obrigação |

Veja `../cms/rules.md` para exemplos.

---

## Fluxos (Quick Ref)

| Fluxo | Entrada | Saída | Arquivo |
|-------|---------|-------|---------|
| Carregar página | pageId | Page + schema/content | cms/page-loading.md |
| Editar JSON | JSON string | contentData | cms/mode-advanced.md |
| Inferir tipo | key + value | input type | cms/type-inference.md |
| Atualizar aninhado | path + value | novo objeto | cms/mutations.md |
| Persistir data | contentData | DB update | cms/server-actions.md |

---

## Padrões (Quick Ref)

| Padrão | Uso | Arquivo |
|-------|-----|---------|
| Server Action save | Persistir dados | quick-ref/patterns.md |
| setDeep com state | Atualizar objeto | quick-ref/patterns.md |
| Ref para latest data | Rastrear valor | quick-ref/patterns.md |
| Condicional render | isAdvanced check | quick-ref/patterns.md |
| Type inference | Determinar input | quick-ref/patterns.md |
| Access control | Validar permission | quick-ref/patterns.md |

---

## Checklist (Quick Ref)

Antes de commit: veja `quick-ref/checklist.md`

3 passos rápidos:
1. ✅ npm run {format,lint,typecheck}
2. ✅ Consultei `cms/rules.md`
3. ✅ Atualizei `cms/changelog.md`

