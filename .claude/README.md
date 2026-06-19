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
- **[context/permissions/_index.md](context/permissions/_index.md)** — Impersonation, RBAC, cookies, login flow

### Users (`src/modules/users/`)
- **[context/users/_index.md](context/users/_index.md)** — SignIn, multi-empresa, perfil, preferências

### Admin (`src/modules/admin/`)
- **[context/admin/_index.md](context/admin/_index.md)** — Painel admin: CRUD empresas/users/devs, permissões, logs

### Projects (`src/modules/projects/`)
- **[context/projects/_index.md](context/projects/_index.md)** — CRUD projetos/páginas, CMS schema/content

### Companies (`src/modules/companies/`)
- **[context/companies/_index.md](context/companies/_index.md)** — Tenant, webhook, guestMode

### Blog (`src/modules/blog/`)
- **[context/blog/_index.md](context/blog/_index.md)** — Posts, categorias, tags hierárquicas

### Upload (`src/modules/upload/`)
- **[context/upload/_index.md](context/upload/_index.md)** — BunnyCDN, image→AVIF, video raw

### Dev (`src/modules/dev/`)
- **[context/dev/_index.md](context/dev/_index.md)** — Painel developer: empresas, usuários

### Guests (`src/modules/guests/`)
- **[context/guests/_index.md](context/guests/_index.md)** — Modo convidado: registro, posts, cookie auth

### Scripts (`src/modules/scripts/`)
- **[context/scripts/_index.md](context/scripts/_index.md)** — SiteScript: HEAD/BODY_END injection

### Backup (`src/scripts/`)
- **[context/backup/_index.md](context/backup/_index.md)** — pg_dump, daemon cron, restauração CLI

### Analytics (`src/modules/analytics/` + `src/lib/analytics/`)
- **[context/analytics/_index.md](context/analytics/_index.md)** — GA4 Data API, dashboards de Resultados (projeto + panorama), funil/eventos/canais/páginas

### CMS (Headless)
- **[context/cms/_index.md](context/cms/_index.md)** — Schema builder, content editor, preview

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
├── README.md                    ← Você está aqui
├── context/
│   ├── permissions/_index.md    ← Auth, RBAC, impersonation, cookies
│   ├── users/_index.md          ← SignIn, multi-empresa, perfil
│   ├── admin/_index.md          ← Painel admin (CRUD all)
│   ├── projects/_index.md       ← Projetos + Páginas + CMS actions
│   ├── companies/_index.md      ← Tenant, webhook, guestMode
│   ├── blog/_index.md           ← Posts, categorias, tags
│   ├── upload/_index.md         ← BunnyCDN, AVIF, video
│   ├── dev/_index.md            ← Painel developer
│   ├── guests/_index.md         ← Modo convidado
│   ├── scripts/_index.md        ← SiteScript injection
│   ├── backup/                  ← pg_dump daemon, restauração CLI
│   └── cms/                     ← CMS headless (múltiplos arquivos)
│       ├── _index.md, overview.md, data-model.md
│       ├── mode-advanced.md, rules.md
│       └── changelog.md
└── quick-ref/
    ├── patterns.md              ← Code snippets
    ├── checklist.md             ← Pre-commit items
    └── glossary.md              ← Terms
```

**Regra**: Cada módulo tem UM arquivo `_index.md` autocontido. CMS é exceção (mais complexo).

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

**Versão**: 3.0 (todos módulos documentados)  
**Data**: 2026-05-24  
**Status**: 🟢 Ativo e otimizado para tokens
