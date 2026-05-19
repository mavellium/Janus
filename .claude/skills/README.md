# 🎯 Skills (Automação de Documentação e Código)

**Central de skills do projeto** — scripts e workflows para automatizar tarefas repetitivas.

---

## 📋 Índice Rápido

| Skill | Arquivo | Descrição | Quando Usar |
|-------|---------|-----------|-------------|
| **Module Docs** | [module-docs.md](module-docs.md) | Documenta módulo inteiro em `.claude/context/` | Novo módulo criado |
| **Registry** | [registry.md](registry.md) | Registra mudanças em PROJECT.md | Automático pós-tarefa |
| **API** | [api.md](api.md) | Padrões REST, endpoints, validação | API design |
| **Database** | [database.md](database.md) | Prisma, migrations, schema | DB changes |
| **Domain** | [domain.md](domain.md) | Domain-driven design, entidades | Arquitetura |
| **Frontend** | [frontend.md](frontend.md) | React, componentes, hooks | UI development |
| **Testing** | [testing.md](testing.md) | Vitest, testes unitários | Test implementation |
| **UI Design** | [ui-design.md](ui-design.md) | Design tokens, responsividade | Component design |
| **DevOps/Sec** | [devops-sec.md](devops-sec.md) | Deployment, segurança | Infra/security |

---

## 🚀 Workflow Típico

```
┌─ Criar novo módulo
├─ Implementar domain + actions + queries
├─ Invoque: @.claude/skills/module-docs.md
│  └─ Gera: .claude/context/[modulo]/ (~5KB documentação)
├─ Invoque: @.claude/skills/registry.md
│  └─ Atualiza: PROJECT.md (~1 linha por mudança)
└─ Próxima sessão: Leia .claude/context/[modulo]/_index.md (1min)
   em vez de 30 min lendo src/modules/[modulo]/
```

---

## ⭐ Top 2 Skills Recomendadas

### 1️⃣ Module Docs — Economizar Tokens
Documente módulos complexos automaticamente:
- **Economia:** 50-100KB tokens por módulo
- **Tempo:** 1 min leitura vs 30 min code scan
- **Saída:** 6 arquivos em `.claude/context/[modulo]/`

**Use:** Após implementar novo módulo (auth, payments, etc)

### 2️⃣ Registry — Manter PROJECT.md Atualizado
Registre todas as alterações automaticamente:
- **Automático:** Executada ao final de cada tarefa
- **Entrada:** Nomes de arquivos criados/alterados
- **Saída:** 1-2 linhas em PROJECT.md

**Obrigatório:** Toda mudança de código

---

## 📚 Como Usar Skills

### Opção 1: Invocação Direta
```
"Use a skill module-docs para documentar o módulo 'auth'"
```

### Opção 2: Referência no Prompt
```
"@.claude/skills/module-docs.md — documentar módulo 'users'"
```

### Opção 3: Busca no README (você está aqui)
Leia este índice, clique no arquivo desejado.

---

## 🎯 Estrutura de Skills

Cada arquivo `.md` segue este padrão:

```yaml
name: skill-name
description: Uma linha descrevendo o objetivo

instructions: |
  ## Objetivo
  Claro e conciso
  
  ## Entrada
  O que a skill recebe
  
  ## Saída
  O que a skill gera
  
  ## Passos
  1. ...
  2. ...
  
  ## Regras Absolutas
  - Nunca fazer X
  - Sempre fazer Y
```

---

## 📌 Contexto de Skills

**Localização:** `.claude/skills/` (você está aqui)  
**Tamanho típico:** 1-3KB por skill  
**Estrutura:** README.md (índice) + N arquivos `.md`

**Relacionadas:**
- `.claude/context/cms/` — Documentação do CMS (exemplo de módulo documentado)
- `.claude/quick-ref/` — Padrões de código reutilizáveis
- `CLAUDE.md` — Diretivas obrigatórias do projeto

---

## 🔄 Manutenção

Atualize este README quando:
- ✅ Adicionar nova skill
- ✅ Remover skill
- ✅ Mudar nome de skill

Não atualize:
- ❌ Conteúdo interno de skills (edite o arquivo direto)
- ❌ Instruções detalhadas (cada skill é responsável pela sua)

---

**Versão:** 1.0  
**Data:** 2026-05-19  
**Status:** 🟢 Pronto para uso
