# Auth — Padrões de Código

## Lazy config (obrigatório para o "lembrar minha conta")

```ts
// src/lib/auth.ts
const buildAuthConfig = async (): Promise<NextAuthConfig> => ({
  ...authConfig,
  session: { strategy: 'jwt', maxAge: await resolveSessionMaxAge() },
  providers: [Credentials({ /* ... */ }), ...(isGoogleAuthConfigured() ? [Google({ /* ... */ })] : [])],
  callbacks: { ...authConfig.callbacks, signIn: googleSignIn, jwt },
  trustHost: true,
})

export const { handlers, auth, signIn, signOut } = NextAuth(buildAuthConfig)
```

`session.maxAge` alimenta o `exp` do JWT **e** o `expires` do cookie (`@auth/core` usa o mesmo valor nos dois). Como o `signIn()` server-side chama a factory sem request, a leitura do cookie é feita via `next/headers` dentro de `resolveSessionMaxAge()`.

## Preferência de sessão antes do signIn

```ts
const remember = formData.get('remember') === 'on'
await saveSessionPreference(remember, email) // grava cookie
await signIn('credentials', { ...parsed.data, redirect: false }) // já lê o cookie novo
```

## Rejeitar login OAuth com mensagem

```ts
// callback signIn — string = redirect e login abortado antes de criar/alterar nada
if (!dbUser) return '/login?error=google_no_account'
return true
```

## Dois submits no mesmo form (credenciais + Google)

```tsx
<form action={action}>
  {/* email, senha, checkbox remember */}
  <button type="submit">Entrar</button>
  <GoogleSignInButton />   {/* formAction={signInWithGoogle} + formNoValidate */}
</form>
```

`formNoValidate` evita que os `required` do form de credenciais bloqueiem o submit do Google; `useFormStatus()` dentro do botão dá o pending sem precisar de outro hook.

## Token de uso único com hash

```ts
const { token, tokenHash } = createResetToken()   // token vai no e-mail, hash no banco
await db.passwordResetToken.create({ data: { userId, tokenHash, expiresAt: resetTokenExpiresAt() } })
// validação
await db.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(tokenFromUrl) } })
```

## E-mail transacional

```ts
const message = buildPasswordResetEmail({ name, resetUrl: `${await appBaseUrl()}/reset-password/${token}` })
const sent = await sendMail({ to: user.email, ...message })
if (!sent.ok) return { ok: false, error: sent.error }
```

`sendMail` usa a API HTTP do Resend via `fetch` (sem SDK). Sem `RESEND_API_KEY`/`MAIL_FROM`: em dev imprime no console e retorna `ok`, em produção retorna erro.

## Card de contas conectadas no painel

```tsx
{authMethods.googleProviderAvailable && (
  <ConnectedAccountsCard
    userId={user.id}
    userEmail={user.email}
    methods={authMethods}
    revalidate={settingsPath}
    onNotify={(message, type) => toast({ message, type })}
  />
)}
```
