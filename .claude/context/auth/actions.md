# Auth — Server Actions

## signInAction (`src/modules/users/actions/signInAction.ts`)

- **Assinatura:** `(prev: SignInState, formData) => Promise<{ error?, redirectUrl? }>` (useActionState)
- **Validação:** Zod `{ email: email, password: min(1) }`
- **Fluxo:** 1. Zod → 2. `saveSessionPreference(remember, email)` (**antes** do `signIn`, para o lazy config ler o cookie na mesma request) → 3. `signIn('credentials', { redirect: false })` → 4. resolve destino (first-access / dev / admin / empresa única / select-company)
- **Campo novo:** `remember` (checkbox `'on'`)
- **Erro comum:** `AuthError` com `IP_BLOCKED` → "Acesso suspenso…"; qualquer outro → "Email ou senha inválidos."

## signInWithGoogle (`src/modules/auth/actions/signInWithGoogle.ts`)

- **Assinatura:** `(formData) => Promise<void>` — usada em `<button formAction={...}>`; **redireciona** (lança `NEXT_REDIRECT`, nunca envolver em try/catch)
- **Fluxo:** 1. lê `remember` + `email` do mesmo form do login → 2. `saveSessionPreference` → 3. `signIn('google', { redirectTo: '/' })` (a rota `/` já redireciona por role no middleware)
- **Autorização:** feita no callback `signIn` de `src/lib/auth.ts` (usuário precisa existir, estar ativo e com `googleAuthEnabled`)

## requestPasswordReset (`src/modules/auth/actions/requestPasswordReset.ts`)

- **Assinatura:** `(prev, formData) => Promise<{ ok?, message?, error? }>`
- **Validação:** Zod `{ email }`
- **Rate limit:** `rateLimit` em memória — 5/15min por IP e 3/15min por e-mail
- **Fluxo:** 1. Zod → 2. rate limit → 3. `findFirst({ email, deletedAt: null })` → 4. transação: invalida tokens abertos + cria token novo → 5. `sendMail` com `{baseUrl}/reset-password/{token}` → 6. `logAudit(UPDATE User)`
- **Anti-enumeração:** e-mail inexistente retorna a **mesma** mensagem genérica de sucesso. Exceção deliberada: falha de envio retorna erro real (evita "enviamos" mentiroso).

## resetPassword (`src/modules/auth/actions/resetPassword.ts`)

- **Validação:** Zod `{ token, password: passwordSchema (@/lib/validations/password), confirmPassword }` + `refine` de igualdade
- **Fluxo:** 1. Zod → 2. `findUnique({ tokenHash })` → 3. rejeita usado/expirado/usuário deletado → 4. `hash(password, 12)` → 5. transação: atualiza senha + `requiresPasswordReset: false`, marca token como usado, invalida os demais → 6. `logAudit(UPDATE User)`
- **Erro comum:** token reusado/expirado → "Link inválido ou expirado. Solicite um novo e-mail."
- **Limitação conhecida:** sessões JWT já emitidas **não** são revogadas ao trocar a senha (sem tabela de sessão).

## setGoogleAuthEnabled (`src/modules/auth/actions/setGoogleAuthEnabled.ts`)

- **Assinatura:** `({ userId, enabled, revalidate? }) => { ok, error? }`
- **Autorização:** `session.user.id === userId` (self-service; sob impersonação retorna "Acesso negado", igual a `changePassword`)
- **Fluxo:** update em `googleAuthEnabled` → se `false`, apaga o `UserOAuthAccount` do Google → `logAudit(UPDATE)` → `revalidatePath`

## unlinkGoogleAccount (`src/modules/auth/actions/unlinkGoogleAccount.ts`)

- **Fluxo:** busca vínculo por `userId_provider` → delete → `logAudit(DELETE User, entityLabel 'Conta Google desvinculada')` → `revalidatePath`
- **Semântica:** desvincular **não** proíbe novo login com Google (o vínculo é recriado no próximo acesso). Para bloquear, use o switch (`googleAuthEnabled: false`).

## Callbacks em `src/lib/auth.ts`

- `signIn` — só atua quando `account.provider === 'google'`; retorna `true` ou string `/login?error=<code>` (Auth.js trata string como redirect e **aborta** o login antes de qualquer criação de usuário)
- `jwt` — para Google, o `user` recebido tem `id` aleatório (Auth.js gera UUID quando não há adapter); recarrega o usuário por e-mail e delega ao `jwt` base de `auth.config.ts` com o registro real (id/role/permissions/companySlug)
