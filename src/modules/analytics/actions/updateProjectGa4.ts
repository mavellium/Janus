'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  projectId: z.string().uuid(),
  companySlug: z.string().min(1),
  ga4PropertyId: z
    .string()
    .trim()
    .regex(/^\d+$/, 'O Property ID deve conter apenas números'),
})

interface Params {
  projectId: string
  companySlug: string
  ga4PropertyId: string
}

export async function updateProjectGa4(params: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false as const, error: 'Não autenticado' }
  }

  const parsed = schema.safeParse(params)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { projectId, companySlug, ga4PropertyId } = parsed.data

  try {
    const company = await db.company.findUnique({
      where: { slug: companySlug, deletedAt: null },
      select: { id: true },
    })
    if (!company) {
      return { ok: false as const, error: 'Empresa não encontrada' }
    }

    if (
      session.user.role !== 'ADMIN' &&
      session.user.companySlug &&
      session.user.companySlug !== companySlug
    ) {
      return { ok: false as const, error: 'Acesso negado' }
    }

    const project = await db.project.findFirst({
      where: { id: projectId, companyId: company.id, deletedAt: null },
      select: { id: true, name: true, ga4PropertyId: true },
    })
    if (!project) {
      return { ok: false as const, error: 'Projeto não encontrado' }
    }

    await db.project.update({
      where: { id: projectId },
      data: { ga4PropertyId },
    })

    await logAudit({
      userId: session.user.id,
      action: 'UPDATE',
      entity: 'Project',
      entityId: projectId,
      entityLabel: `GA4 · ${project.name}`,
      companyId: company.id,
      projectId,
      oldData: { ga4PropertyId: project.ga4PropertyId },
      newData: { ga4PropertyId },
    })

    revalidatePath(`/${companySlug}/dashboard/sites/${projectId}/analytics`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages/${projectId}/analytics`)

    return { ok: true as const, data: { ga4PropertyId } }
  } catch (error) {
    console.error('[updateProjectGa4]', error)
    return { ok: false as const, error: 'Erro ao salvar o Property ID' }
  }
}
