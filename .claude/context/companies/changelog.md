# Companies — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

### [2026-07-15] — Empresa fallback (`default`) oculta do switcher e do roteamento

**Arquivos:**
- `queries/getUserCompanies.ts`: exclui a empresa de slug `default` (placeholder de registro) da lista do `CompanySwitcher`, tanto nos vínculos quanto no fallback primário.
- `app/(auth)/select-company/page.tsx`: filtra a `default` das opções; se sobrar só a `default` (usuário sem empresa real), roteia para `/default/dashboard`; se 1 empresa real, redireciona direto; `/no-company` só quando não há vínculo algum.
- `modules/users/actions/signInAction.ts`: roteamento de login ignora a `default` ao decidir entre ir direto vs `/select-company` (mantém fallback para usuários só-default e sem-vínculo).

**Razão:** `registerUser` vincula todo novo usuário à empresa `default` como fallback primário. Quando o usuário também tinha empresa(s) real(is), a `default` aparecia como opção no switcher e forçava a tela `/select-company`, mesmo tendo efetivamente 1 empresa real.

**Impacto:** a `default` não é mais apresentada como tenant selecionável. Usuário com 1 empresa real não vê o switcher nem a tela de seleção; usuários que só têm a `default` continuam operando dentro dela (comportamento preservado).

### [2026-07-14] — Feed de atividade escopado por usuário efetivo

**Arquivos:**
- `queries/getRecentCompanyActivity.ts`: param opcional `userId` filtra o `AuditLog` (já existente); documentado o uso do usuário efetivo pelo dashboard

**Razão:** "Atividade recente" mostrava ações de outros usuários — inclusive ao inspecionar um usuário (impersonation), quando o `role` do admin fazia o escopo cair para a empresa inteira.

**Impacto:** dashboard passa `ownerId` do usuário efetivo (impersonado quando há impersonation); normal vê só a própria atividade; admin/dev sem impersonation vê tudo.
