'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { uploadImage } from '@/modules/upload/actions/uploadImage'

export async function uploadBlogMedia(input: { file: File; projectId: string }) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false as const, error: 'Não autenticado' }

  const project = await db.project.findUnique({
    where: { id: input.projectId },
    include: { company: true },
  })
  if (!project) return { ok: false as const, error: 'Projeto não encontrado' }
  if (
    session.user.role !== 'ADMIN' &&
    session.user.companySlug !== project.company.slug
  ) {
    return { ok: false as const, error: 'Acesso negado' }
  }

  const result = await uploadImage({ file: input.file, folder: 'blog-content' })
  if (!result.ok || !result.url) {
    return { ok: false as const, error: result.error ?? 'Falha no upload' }
  }

  await db.mediaAsset.create({
    data: {
      url: result.url,
      type: 'IMAGE',
      fileName: input.file.name || null,
      projectId: input.projectId,
      createdById: session.user.id,
    },
  })

  return { ok: true as const, url: result.url }
}
