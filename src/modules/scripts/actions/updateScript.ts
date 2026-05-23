'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  position: z.enum(['HEAD', 'BODY_END']),
  companySlug: z.string().min(1),
})

export async function updateScript(_: unknown, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    code: formData.get('code'),
    position: formData.get('position'),
    companySlug: formData.get('companySlug'),
  })
  if (!parsed.success) return { ok: false, error: 'Dados inválidos' }

  const { id, name, code, position, companySlug } = parsed.data

  try {
    const existing = await db.siteScript.findUnique({
      where: { id },
      select: { project: { select: { id: true, company: { select: { slug: true } } } } },
    })
    if (!existing) return { ok: false, error: 'Script não encontrado' }
    if (
      session.user.role !== 'ADMIN' &&
      session.user.companySlug &&
      existing.project.company.slug !== session.user.companySlug
    ) return { ok: false, error: 'Acesso negado' }

    const updated = await db.siteScript.update({
      where: { id },
      data: { name, code, position },
    })

    revalidatePath(`/${companySlug}/dashboard/sites/${existing.project.id}/scripts`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages/${existing.project.id}/scripts`)
    return { ok: true, data: updated }
  } catch {
    return { ok: false, error: 'Erro ao atualizar script' }
  }
}
