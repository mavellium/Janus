import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Edit3, Settings } from 'lucide-react'
import { db } from '@/lib/prisma'
import { getPagesByProjectId } from '@/modules/projects/queries/getPagesByProjectId'
import { formatDate } from '@/lib/utils'
import { EditPageContainer } from '@/components/projects/EditPageContainer'
import { PublishPageButton } from '@/components/projects/PublishPageButton'
import { CreatePageModal } from '@/components/projects/CreatePageModal'
import { hasPermission, getViewMode } from '@/lib/auth/permissions'
import { getUserPermissions } from '@/modules/auth/queries/getUserPermissions'

export const metadata = { title: 'Páginas — Janus' }

export default async function SitePagesPage({
  params,
}: {
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

  const pages = await getPagesByProjectId(siteId)

  // Fetch permissions fresh from database (not from session cache)
  const freshPermissions = await getUserPermissions(session.user.id)
  const viewMode = await getViewMode()

  const sessionWithFreshPerms = {
    ...session,
    user: {
      ...session.user,
      permissions: freshPermissions,
    },
  }

  const canCreate = hasPermission(sessionWithFreshPerms, 'PAGE_CREATE', 'sites', 'page', viewMode)
  const canBuild = hasPermission(sessionWithFreshPerms, 'PAGE_BUILD', 'sites', 'page', viewMode)
  const canDelete = hasPermission(sessionWithFreshPerms, 'PAGE_DELETE', 'sites', 'page', viewMode)

  return (
    <div className="p-8 w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-brand-text">
            Páginas
          </h1>
          <p className="text-sm text-brand-muted">
            {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
          </p>
        </div>
        {canCreate && <CreatePageModal projectId={siteId} companySlug={companySlug} />}
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light overflow-x-auto">
        <div className="divide-y divide-brand-btn-light min-w-[640px]">
          {pages.map((page) => (
            <div
              key={page.id}
              className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-2 sm:justify-between hover:bg-brand-btn-light/40 transition"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-brand-text">
                  {page.name}
                </h3>
                <p className="text-xs text-brand-muted mt-1">/{page.slug}</p>
                <p className="text-xs text-brand-muted mt-2">{formatDate(page.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canBuild && <PublishPageButton pageId={page.id} initialPublished={page.isPublished} />}
                {canDelete && (
                  <EditPageContainer
                    pageId={page.id}
                    initialName={page.name}
                    initialSlug={page.slug}
                    initialPreviewUrl={page.previewUrl ?? undefined}
                    projectId={siteId}
                    trigger={
                      <button
                        className="px-3 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Configurações
                      </button>
                    }
                  />
                )}
                {canBuild && (
                  <Link
                    href={`/${companySlug}/dashboard/sites/${siteId}/pages/${page.id}/builder`}
                    className="px-3 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Construir
                  </Link>
                )}
                {canBuild && (
                  <Link
                    href={`/${companySlug}/dashboard/sites/${siteId}/pages/${page.id}/edit`}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white transition flex items-center gap-2 bg-brand-primary hover:bg-brand-hover"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {pages.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-brand-muted mb-4">Nenhuma página criada ainda</p>
            {canCreate && <CreatePageModal projectId={siteId} companySlug={companySlug} />}
          </div>
        )}
      </div>
    </div>
  )
}
