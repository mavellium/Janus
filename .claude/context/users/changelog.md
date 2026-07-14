# Users — Histórico

**Instrução:** Atualize aqui cada vez que mexer neste módulo.

### [2026-07-14] — Multi-tenant baseado em vínculos + preferências impersonation-aware

**Arquivos:**
- `queries/getUserCompanies.ts`: deriva a lista das empresas vinculadas (`UserCompany`); `companyId` primário só como fallback quando não há vínculo
- `actions/signInAction.ts`: roteamento pós-login por empresas vinculadas (mesma regra); ignora vínculos de empresa com `deletedAt`
- `actions/updatePreferences.ts`: grava no usuário efetivo (impersonado quando há impersonation)
- `actions/restartOnboarding.ts`: reseta `preferences.onboarding` no usuário efetivo (impersonado) e redireciona

**Razão:** switcher/`/select-company` aparecia para usuário com 1 empresa vinculada quando o `companyId` primário divergia; e o "Refazer tour" não funcionava ao inspecionar um usuário porque as preferências eram gravadas no admin, não no impersonado.

**Impacto:** contagem de empresas = vínculos `UserCompany` (consistente entre `getUserCompanies`, `signInAction` e `/select-company`). Tour de onboarding agora é reiniciável durante impersonation.
