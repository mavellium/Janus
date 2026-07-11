'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { revalidateSites } from '@/lib/revalidateSites'

export async function restoreBlogPostVersion(versionId: string) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const version = await db.blogPostVersion.findUnique({
    where: { id: versionId },
    include: { post: { include: { project: { include: { company: true } } } } },
  })
  if (!version) return { ok: false as const, error: 'Versão não encontrada' }

  const company = version.post.project.company
  if (session.user.role !== 'ADMIN' && session.user.companySlug !== company.slug) {
    return { ok: false as const, error: 'Acesso negado' }
  }

  const post = version.post

  try {
    await db.blogPostVersion.create({
      data: {
        postId: post.id,
        title: post.title,
        subtitle: post.subtitle,
        body: post.body,
        coverImageUrl: post.coverImageUrl,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        seoKeywords: post.seoKeywords,
        readingTime: post.readingTime,
        createdById: session.user.id,
        createdByName: session.user.email ?? null,
      },
    })

    const restored = await db.blogPost.update({
      where: { id: post.id },
      data: {
        title: version.title,
        subtitle: version.subtitle,
        body: version.body,
        coverImageUrl: version.coverImageUrl,
        seoTitle: version.seoTitle,
        seoDescription: version.seoDescription,
        seoKeywords: version.seoKeywords,
        readingTime: version.readingTime,
      },
    })

    revalidatePath(`/${company.slug}/dashboard`)
    revalidateSites(company.slug)
    return {
      ok: true as const,
      data: {
        title: restored.title,
        subtitle: restored.subtitle,
        body: restored.body,
        coverImageUrl: restored.coverImageUrl,
        seoTitle: restored.seoTitle,
        seoDescription: restored.seoDescription,
        seoKeywords: restored.seoKeywords,
      },
    }
  } catch {
    return { ok: false as const, error: 'Erro ao restaurar versão' }
  }
}
