# 📖 .claude — Documentação & Automation Central

**Bem-vindo ao centro de conhecimento do Janus.**  
Escolha abaixo o que você precisa:

---

## 🎯 Rápido (Primeira Vez?)

1. **Contexto CMS?** → Leia [context/cms/_index.md](context/cms/_index.md) (1min)
2. **Novo módulo?** → Use skill [skills/module-docs.md](skills/module-docs.md)
3. **Checklist pré-commit?** → [quick-ref/checklist.md](quick-ref/checklist.md)

---

## 📚 Estrutura Completa

### 🏗️ [context/](context/)
**Documentação de módulos e arquitetura**

| Pasta | Conteúdo | Tamanho | Economia |
|-------|----------|---------|----------|
| [context/cms/](context/cms/) | CMS (Legado + Avançado) | 15KB | 50-100KB tokens |
| [context/[modulo]/](context/) | Novos módulos (quando documentados) | ~5KB | ~50KB tokens |

**Como usar:** Leia `_index.md` de cada módulo documentado (1 min), em vez de 30 min lendo código.

---

### 🎯 [skills/](skills/)
**Automação: documentação, registro, padrões**

| Skill | Uso | Economia |
|-------|-----|----------|
| [module-docs.md](skills/module-docs.md) | Documentar novo módulo | 50-100KB tokens |
| [registry.md](skills/registry.md) | Registrar mudanças em PROJECT.md | Manutenção automática |
| [api.md](skills/api.md) | Padrões de API REST | Design reference |
| [database.md](skills/database.md) | Prisma, migrations | DB reference |
| [frontend.md](skills/frontend.md) | React, componentes, hooks | Code patterns |
| Mais... | [Veja README.md](skills/README.md) | Índice completo |

**Como usar:** Invoque a skill diretamente no prompt, ou veja [skills/README.md](skills/README.md).

---

### 📖 [quick-ref/](quick-ref/)
**Referência rápida: padrões, checklist, termos**

| Arquivo | Conteúdo | Máximo |
|---------|----------|--------|
| [patterns.md](quick-ref/patterns.md) | Code snippets copy-paste | 2KB |
| [checklist.md](quick-ref/checklist.md) | Pré-commit validation | 1KB |
| [glossary.md](quick-ref/glossary.md) | Termos/abreviações | 1KB |

**Como usar:** Ctrl+F para buscar, copy-paste direto no código.

---

## 🔄 Workflow Completo

```
┌─ Nova tarefa
├─ Leia PROJECT.md para contexto
├─ Se CMS → leia context/cms/rules.md
├─ Se novo módulo → invoque skills/module-docs.md
├─ Se código → use quick-ref/patterns.md
├─ IMPLEMENTE
├─ Valide quick-ref/checklist.md
└─ registry.md executa automaticamente
```

---

## 💡 Economia de Tokens

| Cenário | Sem Docs | Com Docs | Economia |
|---------|----------|----------|----------|
| Novo módulo | 30 min + 50KB tokens | 1 min + 1KB tokens | **50KB tokens** |
| CMS edit | 20 min + 40KB tokens | 3 min + 2KB tokens | **38KB tokens** |
| Pattern lookup | 15 min + 20KB tokens | 30 sec + 0.5KB tokens | **20KB tokens** |
| **Total por sessão** | ~30 min | ~5 min | **~100KB tokens** |

---

## 🔗 Conexões Rápidas

**Fora de .claude:**
- `CLAUDE.md` — Diretivas obrigatórias (npm→pnpm, CMS rules, registry obrigatório)
- `PROJECT.md` — Registro de arquivos criados/alterados (manutenção automática)

**Dentro de .claude:**
- [context/cms/rules.md](context/cms/rules.md) — Regras CMS (❌/✅)
- [context/cms/changelog.md](context/cms/changelog.md) — Histórico CMS
- [skills/README.md](skills/README.md) — Índice completo de skills
- [quick-ref/patterns.md](quick-ref/patterns.md) — Copy-paste snippets

---

## 📌 Para Claude Futuro

**Você está vendo este arquivo porque:**
1. Precisa entender a estrutura de documentação
2. Está começando uma nova tarefa
3. Quer economizar tokens em futuras sessões

**Dicas:**
- ✅ Leia `PROJECT.md` PRIMEIRO (1 min overview)
- ✅ Depois vá a `context/[modulo]/_index.md` (1 min detalhe)
- ✅ Se tiver padrão similar, veja `quick-ref/patterns.md`
- ✅ Se fizer mudança, registry.md registra automaticamente
- ✅ Se criar módulo, invoque skills/module-docs.md

**Não faça:**
- ❌ Não leia arquivos inteiros de `src/modules/[modulo]/` se há docs em `context/[modulo]/`
- ❌ Não ignore `PROJECT.md` no início (2 min de leitura economizam 30 min depois)
- ❌ Não crie novo módulo sem invocar skills/module-docs.md

---

**Versão:** 1.0  
**Data:** 2026-05-19  
**Status:** 🟢 Pronto
