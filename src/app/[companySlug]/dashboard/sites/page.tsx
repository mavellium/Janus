import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ArrowRight } from 'lucide-react'
import { db } from '@/lib/prisma'
import { getProjects } from '@/modules/projects/queries/getProjects'
import { formatDate } from '@/lib/utils'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { EditProjectContainer } from '@/components/projects/EditProjectContainer'
import { EditProjectButton } from '@/components/projects/EditProjectButton'
import { DeleteProjectModal } from '@/components/projects/DeleteProjectModal'

export const metadata = { title: 'Sites — Janus' }

export default async function SitesPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await auth()
  if (!session?.user) redirect('/login')

  const company = await db.company.findUnique({
    where: { slug: companySlug, deletedAt: null },
  })
  if (!company) redirect('/login')

  const projects = await getProjects({ companyId: company.id, type: 'INSTITUTIONAL' })

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/${companySlug}/dashboard`} className="text-brand-primary hover:opacity-80">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-brand-text">
              Sites
            </h1>
          </div>
          <p className="text-sm text-brand-muted">
            {projects.length} {projects.length === 1 ? 'site' : 'sites'} institucional
            {projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {projects.length > 0 && (
          <CreateProjectModal
            type="INSTITUTIONAL"
            companySlug={companySlug}
            trigger={
              <button
                className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition bg-destructive hover:opacity-90"
              >
                Novo Site
              </button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-card rounded-xl border border-brand-btn-light overflow-hidden hover:shadow-lg transition relative"
          >
            <div className="h-32 bg-gradient-to-br from-brand-btn-light to-brand-muted/40 relative">
              <div className="absolute top-3 right-3">
                <DeleteProjectModal
                  projectId={project.id}
                  projectName={project.name}
                  companySlug={companySlug}
                />
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-1 text-brand-text">
                {project.name}
              </h3>
              <p className="text-xs text-brand-muted mb-4">{formatDate(project.createdAt)}</p>
              <div className="mb-4 pb-4 border-b border-brand-btn-light">
                <p className="text-xs text-brand-muted">
                  {project._count.pages} {project._count.pages === 1 ? 'página' : 'páginas'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/${companySlug}/dashboard/sites/${project.id}/pages`}
                  className="flex-1 px-4 py-2.5 rounded-lg text-xs font-semibold transition text-center flex items-center justify-center gap-2 text-brand-text bg-brand-btn-light hover:opacity-80"
                >
                  <ArrowRight className="w-3 h-3" />
                  Gerenciar
                </Link>
                <EditProjectContainer
                  projectId={project.id}
                  initialName={project.name}
                  companySlug={companySlug}
                  trigger={<EditProjectButton />}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2 text-brand-text">
              Nenhum site criado ainda
            </p>
            <p className="text-sm text-brand-muted mb-6">
              Comece criando seu primeiro site institucional
            </p>
            <CreateProjectModal
              type="INSTITUTIONAL"
              companySlug={companySlug}
              trigger={
                <button
                  className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition bg-brand-btn-dark hover:bg-brand-hover"
                >
                  Criar primeiro site
                </button>
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
