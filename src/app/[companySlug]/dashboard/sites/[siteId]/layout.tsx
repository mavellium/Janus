import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/prisma'
import { ContextSidebar } from '@/components/dashboard/ContextSidebar'

export default async function SiteContextLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string; siteId: string }>
}) {
  const { companySlug, siteId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const project = await db.project.findUnique({
    where: { id: siteId, deletedAt: null, companyId: company.id },
  })
  if (!project) redirect(`/${companySlug}/dashboard/sites`)

  return (
    <div className="min-h-screen flex bg-brand-bg">
      <ContextSidebar
        companySlug={companySlug}
        projectId={siteId}
        projectName={project.name}
        projectType={project.type}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
