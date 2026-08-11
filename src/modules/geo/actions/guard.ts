import { auth } from '@/lib/auth'
import { getImpersonatedUserId } from '@/lib/auth/permissions'

export interface AdminActor {
  userId: string
}

export async function requireAdmin(): Promise<
  { ok: true; actor: AdminActor } | { ok: false; error: string; code: number }
> {
  const session = await auth()

  if (!session?.user?.id) {
    return { ok: false, error: 'Não autorizado', code: 401 }
  }

  if (session.user.role !== 'ADMIN') {
    return { ok: false, error: 'Acesso negado', code: 403 }
  }

  const impersonatedUserId = await getImpersonatedUserId()

  return { ok: true, actor: { userId: impersonatedUserId ?? session.user.id } }
}
