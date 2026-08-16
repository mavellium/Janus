# Auth — Entidades e Domínio

## User (campos de auth)

- `password` (Text, **obrigatório** — nunca nulo, inclusive para quem usa Google)
- `requiresPasswordReset` (bool) — senha provisória; bloqueia login Google (`google_reset_required`)
- `googleAuthEnabled` (bool, default `true`) — chave que autoriza o provider Google para a conta; controlada pelo próprio usuário em Ajustes › Contas conectadas
- `deletedAt` — soft delete; **todo lookup de auth filtra `deletedAt: null`**

## UserOAuthAccount (`user_oauth_accounts`)

- **Tipo:** Prisma model
- **Campos:** id (UUID), userId (fk→users CASCADE), provider (string, hoje só `'google'`), providerAccountId (sub do Google), providerEmail, linkedAt, lastLoginAt
- **Unique:** `[provider, providerAccountId]` (uma identidade Google → um único usuário) e `[userId, provider]` (um vínculo por provider por usuário)
- **Invariantes:** escrito apenas pelo callback `signIn` (upsert por `userId_provider`); é registro/bookkeeping — **a decisão de autenticar nunca depende dele**, e por isso a falha de escrita é logada e engolida
- **Não é** o model `Account` do Auth.js: não guarda tokens de acesso

## PasswordResetToken (`password_reset_tokens`)

- **Campos:** id (UUID), userId (fk→users CASCADE), tokenHash (unique), expiresAt, usedAt, ip, userAgent, createdAt
- **Invariantes:** o token em claro **nunca** é persistido (`sha256` em `tokenHash`); TTL 30 min (`PASSWORD_RESET_TTL_MINUTES`); uso único; ao pedir novo link, os anteriores não usados são marcados como usados
- **Helpers:** `src/modules/auth/domain/passwordReset.ts` — `createResetToken()` (32 bytes randômicos base64url), `hashResetToken()`, `resetTokenExpiresAt()`, `isResetTokenUsable()`

## LoginAttempt (`login_attempts`)

Rate limit por IP: 3 falhas na última hora bloqueiam login por credenciais **e** por Google (`ip_blocked`). Tentativas Google (sucesso e falha) também são registradas.

## Cookies (`src/lib/auth/session.ts`)

| Cookie                    | Conteúdo   | Efeito                                                                 |
| :------------------------ | :--------- | :--------------------------------------------------------------------- |
| `janus.remember_session`  | `'1'`/`'0'`| `'0'` → `session.maxAge` 8h; qualquer outro valor/ausente → 30 dias     |
| `janus.remembered_email`  | e-mail     | Pré-preenche o campo de e-mail em `/login` e `/forgot-password`         |

Ambos HttpOnly, `sameSite: 'lax'`, `secure` em produção, 1 ano. Constantes: `REMEMBERED_SESSION_MAX_AGE`, `SHORT_SESSION_MAX_AGE`.

## Códigos de erro (`src/modules/auth/domain/loginErrors.ts`)

Chegam como `/login?error=<code>` e são traduzidos por `loginErrorMessage(code)`.

- `ip_blocked` — 3+ falhas na última hora
- `google_unverified` — `profile.email_verified !== true` ou sem e-mail
- `google_no_account` — nenhum `User` ativo com aquele e-mail
- `google_disabled` — `googleAuthEnabled: false`
- `google_reset_required` — conta com senha provisória
- `OAuthAccountNotLinked` / `OAuthSignin` / `OAuthCallbackError` / `AccessDenied` / `Configuration` — vindos do próprio Auth.js

## Env

`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` (aliases aceitos: `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) — sem os dois o provider **não é registrado** e o botão não é renderizado (`isGoogleAuthConfigured()`). Redirect URI: `{NEXTAUTH_URL}/api/auth/callback/google`.
`RESEND_API_KEY` + `MAIL_FROM` — sem os dois, em dev o link de redefinição vai para o console; em produção a action falha com erro explícito.
