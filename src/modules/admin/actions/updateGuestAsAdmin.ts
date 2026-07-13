'use server'

import { z } from 'zod'
import { db } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit-logger'

const schema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
})

export async function updateGuestAsAdmin(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { ok: false, error: 'Acesso não autorizado.' }

  const parsed = schema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    email: formData.get('email'),
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

  const existing = await db.guestEntry.findUnique({
    where: { id: parsed.data.id },
  })
  if (!existing) return { ok: false, error: 'Convidado não encontrado.' }

  const conflict = await db.guestEntry.findFirst({
    where: { email: parsed.data.email, companyId: existing.companyId, id: { not: parsed.data.id } },
  })
  if (conflict) return { ok: false, error: 'E-mail já está em uso nesta empresa.' }

  const updated = await db.guestEntry.update({
    where: { id: parsed.data.id },
    data: { name: parsed.data.name, email: parsed.data.email },
  })

  await logAudit({
    userId: session.user.id,
    action: 'UPDATE',
    entity: 'GuestEntry',
    entityId: parsed.data.id,
    entityLabel: updated.name,
    companyId: existing.companyId,
    oldData: existing,
    newData: updated,
  })

  revalidatePath('/dashboard-admin/guests')
  return { ok: true }
}
