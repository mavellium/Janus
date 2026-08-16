# Auth — Índice

Autenticação do Janus: login por credenciais, login com Google (OAuth), sessão "lembrar minha conta" e redefinição de senha por e-mail. NextAuth v5 (`next-auth@5.0.0-beta.31`) com estratégia **JWT** e **sem database adapter**.

| Aspecto      | Responsável                                                                                     |
| :----------- | :---------------------------------------------------------------------------------------------- |
| Config edge  | `src/lib/auth.config.ts` — `authorized` (middleware), `jwt`, `session`                          |
| Config node  | `src/lib/auth.ts` — providers, `signIn` callback, `jwt` enriquecido, `session.maxAge` dinâmico   |
| Entidades    | `User.googleAuthEnabled`, `UserOAuthAccount`, `PasswordResetToken`, `LoginAttempt`               |
| Actions      | `signInAction` (users), `signInWithGoogle`, `requestPasswordReset`, `resetPassword`, `setGoogleAuthEnabled`, `unlinkGoogleAccount` |
| Queries      | `getUserAuthMethods`, `getPasswordResetTokenStatus`, `getCompanyUsers`                            |
| Infra        | `src/lib/mail.ts` (Resend HTTP), `src/lib/auth/session.ts` (cookies de preferência), `src/lib/auth/oauth.ts` |

- [domain.md](domain.md) — entidades, tokens, códigos de erro
- [actions.md](actions.md) — server actions e fluxos
- [queries.md](queries.md) — leituras
- [patterns.md](patterns.md) — snippets reutilizáveis
- [changelog.md](changelog.md) — histórico
- RBAC, impersonação e view mode: [../permissions/_index.md](../permissions/_index.md)

## Para usar este módulo, você deve saber

1. **Não existe adapter Prisma.** Sessão é JWT puro; o vínculo OAuth é persistido pelo próprio callback `signIn` em `UserOAuthAccount`. Não reintroduza `PrismaAdapter` sem criar `Account`/`Session`/`VerificationToken` (o `linkAccount` do adapter recebe `expires_in` do Google e quebra em Prisma).
2. **Google não cria usuário.** O login só é aceito se já existir `User` ativo (`deletedAt: null`) com aquele e-mail e `googleAuthEnabled: true`. Rejeição = `return '/login?error=<code>'` no callback `signIn`.
3. **`NextAuth()` recebe uma função** (lazy init) porque `session.maxAge` depende do cookie `janus.remember_session`. Nunca troque por objeto estático — quebra o "lembrar minha conta".
4. **`src/lib/auth.config.ts` roda no edge** (middleware). Nada de Prisma, `node:crypto` ou `next/headers` nele.
5. Toda mutação de senha/vínculo chama `logAudit()` com `entity: 'User'`.
