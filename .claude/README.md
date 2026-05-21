# 🏗️ Janus CMS — Knowledge Base

**Documentação organizada por tópico para máxima eficiência.**  
**Leia o índice abaixo, depois acesse apenas o que precisa.**

---

## 📍 Índice Rápido

### Para Começar (1ª vez ou reorientação)
- **[context/cms/_index.md](context/cms/_index.md)** — Sumário executivo (1min leitura)
- **[context/cms/overview.md](context/cms/overview.md)** — Visão geral da arquitetura (3min)

### Entender um Fluxo
- **Modo Legado?** → [context/cms/mode-legacy.md](context/cms/mode-legacy.md)
- **Modo Avançado?** → [context/cms/mode-advanced.md](context/cms/mode-advanced.md)
- **Como os tipos são inferidos?** → [context/cms/type-inference.md](context/cms/type-inference.md)
- **Como a mutação funciona?** → [context/cms/mutations.md](context/cms/mutations.md)

### Implementar/Debugar
- **Preciso persistir dados** → [context/cms/server-actions.md](context/cms/server-actions.md)
- **Preciso carregar uma página** → [context/cms/page-loading.md](context/cms/page-loading.md)
- **Qual é a regra arquitetural?** → [context/cms/rules.md](context/cms/rules.md)
- **Layout está quebrando?** → [context/cms/layout.md](context/cms/layout.md)

### Referência Rápida
- **Padrões de código** → [quick-ref/patterns.md](quick-ref/patterns.md)
- **Checklist pré-commit** → [quick-ref/checklist.md](quick-ref/checklist.md)
- **Termos/Abreviações** → [quick-ref/glossary.md](quick-ref/glossary.md)

### Registro de Histórico
- **O que mudou e quando (CMS)?** → [context/cms/changelog.md](context/cms/changelog.md)
- **O que mudou e quando (Blog)?** → [context/blog/changelog.md](context/blog/changelog.md)

---

## 📝 Módulos Documentados

### Auth/Permissions (`src/modules/auth/`)
- **[context/auth/_index.md](context/auth/_index.md)** — Sumário executivo (1min)
- **[context/auth/domain.md](context/auth/domain.md)** — Roles, cookies, permission constants
- **[context/auth/actions.md](context/auth/actions.md)** — start/stopImpersonation, checkIpStatus
- **[context/auth/queries.md](context/auth/queries.md)** — getCompanyUsers, effective permissions
- **[context/auth/patterns.md](context/auth/patterns.md)** — Sidebar impersonated, Shield/Voltar ao Painel

### Blog (`src/modules/blog/`)
- **[context/blog/_index.md](context/blog/_index.md)** — Sumário executivo (1min)
- **[context/blog/domain.md](context/blog/domain.md)** — BlogPost, BlogCategory, BlogTag
- **[context/blog/actions.md](context/blog/actions.md)** — create/update/delete/toggle
- **[context/blog/queries.md](context/blog/queries.md)** — getBlogPosts, getCategories, getTags
- **[context/blog/patterns.md](context/blog/patterns.md)** — snippets copy-paste

---

## 🎯 Fluxo de Trabalho

### Ao EDITAR o CMS

1. **Verifique a regra**: `context/cms/rules.md` (seção relevante)
2. **Entenda o fluxo**: `context/cms/mode-{legacy|advanced}.md`
3. **Implemente**: Use padrões em `quick-ref/patterns.md`
4. **Valide**: Checklist em `quick-ref/checklist.md`
5. **Documente**: Atualize `context/cms/changelog.md`

### Ao DEBUGAR

1. **Qual modo está ativado?** → `context/cms/data-model.md` (campo `isAdvanced`)
2. **Onde os dados fluem?** → Diagrama em `context/cms/mode-{legacy|advanced}.md`
3. **Qual regra violei?** → `context/cms/rules.md` (❌ Proibições / ✅ Obrigações)
4. **Padrão similar existe?** → `quick-ref/patterns.md`

---

## 📊 Estrutura de Pastas

```
.claude/
├── README.md                  ← Você está aqui
├── context/cms/
│   ├── _index.md             ← Sumário CMS (1KB)
│   ├── overview.md           ← Visão geral (2KB)
│   ├── data-model.md         ← Prisma Page model (2KB)
│   ├── mode-legacy.md        ← Fluxo legado (3KB)
│   ├── mode-advanced.md      ← Fluxo avançado (5KB)
│   ├── type-inference.md     ← Algoritmo inferType (2KB)
│   ├── mutations.md          ← setDeep + imutabilidade (3KB)
│   ├── server-actions.md     ← updatePageContent*, patterns (3KB)
│   ├── page-loading.md       ← Server components, fetch (2KB)
│   ├── rules.md              ← ❌/✅ Regras (2KB)
│   ├── layout.md             ← Containers, overflow (2KB)
│   ├── permissions.md        ← Read/write access (1KB)
│   ├── public-api.md         ← /api/v1/content (1KB)
│   └── changelog.md          ← Histórico (↑ cresce)
└── quick-ref/
    ├── patterns.md           ← Code snippets (2KB)
    ├── checklist.md          ← Pre-commit items (1KB)
    └── glossary.md           ← Terms (1KB)
```

**Total de contexto para 1ª orientação**: ~10KB (rápido)  
**Total de contexto ao editar**: ~5KB (fichário específico + patterns)

---

## 🔄 Ciclo de Vida de Uma Mudança

```
┌─ Preciso mexer no CMS
├─ Leia: context/cms/_index.md (entender escopo)
├─ Leia: context/cms/rules.md (validar contra regras)
├─ Leia: context/cms/mode-*.md (entender fluxo)
├─ Consulte: quick-ref/patterns.md (copie pattern)
├─ IMPLEMENTE
├─ Valide: quick-ref/checklist.md
├─ TESTE (pnpm typecheck, etc)
├─ Atualize: context/cms/changelog.md (1-2 linhas)
└─ COMMIT + PUSH
```

---

## 💡 Dicas de Economia de Tokens

- **Leia apenas o que precisa**: Use o índice acima
- **Arquivo pequeno = rápido carregar**: ~1-5KB cada
- **Patterns é seu amigo**: Copy-paste de `quick-ref/patterns.md`
- **Changelog cresce lentamente**: Atualize 2 linhas por mudança
- **_index.md é sua bussola**: Releia se perdido

---

## 🔒 Regra de Manutenção

A diretiva em `CLAUDE.md` força:
1. Consultar `.claude/context/cms/rules.md` ANTES de código
2. Atualizar `.claude/context/cms/changelog.md` DEPOIS de mudança
3. Usar padrões em `.claude/quick-ref/patterns.md`

---

**Versão**: 2.0 (reorganizado)  
**Data**: 2026-05-19  
**Status**: 🟢 Ativo e otimizado para tokens
