# Companies — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

### [2026-07-14] — Feed de atividade escopado por usuário efetivo

**Arquivos:**
- `queries/getRecentCompanyActivity.ts`: param opcional `userId` filtra o `AuditLog` (já existente); documentado o uso do usuário efetivo pelo dashboard

**Razão:** "Atividade recente" mostrava ações de outros usuários — inclusive ao inspecionar um usuário (impersonation), quando o `role` do admin fazia o escopo cair para a empresa inteira.

**Impacto:** dashboard passa `ownerId` do usuário efetivo (impersonado quando há impersonation); normal vê só a própria atividade; admin/dev sem impersonation vê tudo.
