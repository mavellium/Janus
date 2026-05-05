# Workflow — Bugfixing & Refactoring
Siga este protocolo rigoroso para corrigir erros ou refatorar código existente.

`Logs` → `Reprodução` → `Teste Falho` → `Correção` → `Validação` → `Registry`

---

## 1. Diagnóstico e Logs
- Analise os logs do terminal, do navegador ou do Prisma.
- Identifique a camada da falha: **Domínio** (lógica), **API** (server action/query) ou **Infra** (banco/network).

## 2. Teste de Reprodução (Obrigatório)
Antes de tocar no código de produção:
- Crie um arquivo de teste `.spec.ts` que reproduza exatamente o erro.
- Execute `npm run test` e confirme que o teste falhou.
- **Regra:** Se você não consegue reproduzir o erro com um teste, você ainda não entendeu o erro.

## 3. Correção (Fix)
- Aplique a correção seguindo as regras de **"Sem Gambiarras"** do `CLAUDE.md`.
- Mantenha o código limpo e **sem comentários**.
- Se a correção exigir mudança no banco, use a skill `database`.

## 4. Validação e Regressão
- Rode `npm run test` para garantir que o novo teste passa.
- Rode `npm run typecheck` para garantir que nenhuma tipagem foi quebrada.
- Garanta que erros antigos não voltaram.

## 5. Registro (Registry)
Skill associada: `registry`
- Atualize o `PROJECT.md`.
- Adicione uma entrada clara na tabela de alterações:
  | Data | Arquivo | Descrição |
  | :--- | :--- | :--- |
  | YYYY-MM-DD | `arquivo` | FIX: corrigido erro de [descrição] via [solução] |

---
**Proibição:** É estritamente proibido o uso de `try-catch` vazios ou `console.log` para "abafar" erros. Se falhar, deve falhar de forma explícita e tratada.