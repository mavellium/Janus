# Auth — Histórico

**Instrução:** atualize aqui cada vez que mexer neste módulo.

### [2026-08-16] — Tela de recuperação de acesso: confirmação útil e correção de e-mail

**Arquivos:**

- `src/modules/auth/actions/requestPasswordReset.ts`: `RequestPasswordResetState` ganhou `email` (devolvido em **todas** as saídas, inclusive quando a conta não existe — do contrário a tela de confirmação revelaria a existência do usuário); erro de rate limit passou a informar os minutos reais vindos de `RateLimitResult.resetAt`
- `src/components/auth/ForgotPasswordForm.tsx`: tela de confirmação com o e-mail de destino, validade do link, dica de spam, "Enviar novamente" (mesma action, `email` em input hidden) e "Digitei o e-mail errado" (volta ao formulário sem recarregar); `role="alert"` no erro, `autoFocus` e `aria-describedby` no campo, spinner no submit
- `src/app/(auth)/forgot-password/page.tsx` e `src/app/(auth)/reset-password/[token]/page.tsx`: TTL vem de `PASSWORD_RESET_TTL_MINUTES` em vez de "30 minutos" escrito na mão

**Razão:** a confirmação anterior só repetia a mensagem genérica — não dava para conferir o e-mail digitado, saber o prazo do link nem reenviar sem recarregar a página.

**Impacto:** `ForgotPasswordForm` agora exige a prop `linkTtlMinutes`. A constante do TTL **não** pode ser importada direto no componente cliente: `passwordReset.ts` importa `node:crypto`, então o valor desce como prop a partir da page.

### [2026-08-16] — Login com Google, lembrar minha conta e redefinição de senha

**Arquivos:**

- `prisma/schema.prisma` + `migrations/20260816120000_auth_google_and_password_reset`: `User.googleAuthEnabled`, models `UserOAuthAccount` e `PasswordResetToken`
- `src/lib/auth.ts`: **removido `PrismaAdapter`** (models `Account`/`Session`/`VerificationToken` nunca existiram no schema e o `linkAccount` recebe `expires_in` do Google), lazy config, provider Google condicional, callbacks `signIn`/`jwt`
- `src/lib/auth/session.ts`, `src/lib/auth/oauth.ts`, `src/lib/mail.ts`, `src/lib/app-url.ts`: novos
- `src/modules/auth/domain/{passwordReset,passwordResetEmail,loginErrors}.ts`: novos
- `src/modules/auth/actions/{signInWithGoogle,requestPasswordReset,resetPassword,setGoogleAuthEnabled,unlinkGoogleAccount}.ts`: novos
- `src/modules/auth/queries/{getUserAuthMethods,getPasswordResetTokenStatus}.ts`: novos
- `src/modules/users/actions/signInAction.ts`: grava a preferência de sessão antes do `signIn`
- `src/components/auth/{LoginForm,GoogleSignInButton,ForgotPasswordForm,ResetPasswordForm,ConnectedAccountsCard}.tsx`
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/[token]/page.tsx`
- Configurações (tenant, dev, admin): card "Contas conectadas"

**Razão:** login social, sessão persistente opcional e recuperação de senha self-service — antes o reset dependia de um admin definir senha provisória.

**Impacto:**

- `NextAuth()` agora é inicializado por função; qualquer refactor para objeto estático quebra o "lembrar minha conta".
- Sessão de quem **não** marca a caixa cai de 30 dias para 8h.
- Google é credencial alternativa para contas existentes — **nunca** cria usuário.
- `LoginForm` passou a exigir props (`googleEnabled`, `defaultEmail`, `defaultRemember`, `providerError`, `passwordResetDone`).
- `DevSettingsClient` passou a exigir `authMethods` e `settingsPath` (usado também por `/dashboard-admin/settings`).
