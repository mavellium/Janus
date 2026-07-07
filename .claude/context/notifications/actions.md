# Notifications — Server Actions

## markNotificationsSeen(): Promise<{ ok: true; data: null } | { ok: false; error: string; code?: number }>
Arquivo: `src/modules/notifications/actions/markNotificationsSeen.ts`
- Fluxo: auth → read-merge-write de `User.preferences` gravando `notifications_last_seen_at = now ISO`.
- Sem `revalidatePath` — o consumidor (`MarkNotificationsSeen`) chama `router.refresh()` após sucesso.
- Sem `logAudit` (preferência de usuário, não entidade crítica — mesmo padrão de `updatePreferences`).

## refreshReleases()
Arquivo: `src/modules/notifications/actions/refreshReleases.ts`

## refreshReleases(): Promise<{ ok: true; data: null } | { ok: false; error: string; code?: number }>
- Fluxo: auth (`session.user.id` obrigatório, qualquer role) → `updateTag('github-releases')`.
- **Next 16**: usa `updateTag` (read-your-own-writes em Server Actions) — `revalidateTag(tag, profile)` agora exige 2 argumentos e tem semântica stale-while-revalidate; não usar para este caso.
- Sem input → sem Zod; sem mutação de entidade → sem `logAudit`.
- Consumida por `RefreshReleasesButton` (Client, `useActionState`) presente no header das 3 páginas de notificações.
