'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  position: z.enum(['HEAD', 'BODY_END']),
  companySlug: z.string().min(1),
})

export async function createScript(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    projectId: formData.get('projectId'),
    name: formData.get('name'),
    code: formData.get('code'),
    position: formData.get('position'),
    companySlug: formData.get('companySlug'),
  })
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  const { projectId, name, code, position, companySlug } = parsed.data

  try {
    const project = await db.project.findUnique({
      where: { id: projectId, deletedAt: null },
      select: { id: true, companyId: true, company: { select: { slug: true } } },
    })
    if (!project) return { ok: false, error: 'Projeto não encontrado' }
    if (
      session.user.role !== 'ADMIN' &&
      session.user.companySlug &&
      project.company.slug !== session.user.companySlug
    ) return { ok: false, error: 'Acesso negado' }

    const script = await db.siteScript.create({
      data: { projectId, name, code, position },
    })

    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      entity: 'SiteScript',
      entityId: script.id,
      entityLabel: script.name,
      companyId: project.companyId,
      projectId,
      newData: script,
    })

    revalidatePath(`/${companySlug}/dashboard/sites/${projectId}/scripts`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages/${projectId}/scripts`)
    return { ok: true, data: script }
  } catch {
    return { ok: false, error: 'Erro ao criar script' }
  }
}
