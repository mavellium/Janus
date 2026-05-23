'use server'

import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteScript({ id, companySlug }: { id: string; companySlug: string }) {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

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

    await db.siteScript.delete({ where: { id } })

    revalidatePath(`/${companySlug}/dashboard/sites/${existing.project.id}/scripts`)
    revalidatePath(`/${companySlug}/dashboard/landing-pages/${existing.project.id}/scripts`)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Erro ao excluir script' }
  }
}
