'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function toggleResolveBlogComment(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const comment = await db.blogComment.findUnique({
    where: { id },
    include: { post: { include: { project: { include: { company: true } } } } },
  })
  if (!comment) return { ok: false as const, error: 'Comentário não encontrado' }
  if (
    session.user.role !== 'ADMIN' &&
    session.user.companySlug !== comment.post.project.company.slug
  ) {
    return { ok: false as const, error: 'Acesso negado' }
  }

  await db.blogComment.update({
    where: { id },
    data: { resolved: !comment.resolved },
  })

  return { ok: true as const }
}
