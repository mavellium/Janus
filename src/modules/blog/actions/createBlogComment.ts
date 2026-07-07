'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function createBlogComment(input: { postId: string; body: string }) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const body = input.body.trim()
  if (!body) return { ok: false as const, error: 'Comentário vazio' }

  const post = await db.blogPost.findUnique({
    where: { id: input.postId },
    include: { project: { include: { company: true } } },
  })
  if (!post) return { ok: false as const, error: 'Artigo não encontrado' }
  if (
    session.user.role !== 'ADMIN' &&
    session.user.companySlug !== post.project.company.slug
  ) {
    return { ok: false as const, error: 'Acesso negado' }
  }

  await db.blogComment.create({
    data: {
      postId: input.postId,
      body,
      authorId: session.user.id,
      authorName: session.user.email ?? 'Usuário',
    },
  })

  return { ok: true as const }
}
