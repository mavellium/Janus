import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/prisma'
import { ChevronLeft, Undo2, Redo2, Save, Send } from 'lucide-react'

export const metadata = { title: 'Editor — Janus' }

export default async function SiteBuilderPage({
  params,
}: {
  params: Promise<{ companySlug: string; siteId: string; pageId: string }>
}) {
  const { companySlug, siteId, pageId } = await params
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

  const page = await db.page.findUnique({
    where: { id: pageId, projectId: siteId, deletedAt: null },
  })
  if (!page) redirect(`/${companySlug}/dashboard/sites/${siteId}/pages`)

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="border-b border-brand-muted/40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${companySlug}/dashboard/sites/${siteId}/pages`} className="text-brand-primary hover:opacity-80">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-sm text-brand-muted">Editando</p>
            <h1 className="text-lg font-semibold" style={{ color: '#161718' }}>
              {page.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-brand-muted/20 rounded-lg transition" title="Desfazer">
            <Undo2 className="w-4 h-4" style={{ color: '#514030' }} />
          </button>
          <button className="p-2 hover:bg-brand-muted/20 rounded-lg transition" title="Refazer">
            <Redo2 className="w-4 h-4" style={{ color: '#514030' }} />
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition"
            style={{ backgroundColor: '#514030' }}
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition"
            style={{ backgroundColor: '#161718' }}
          >
            <Send className="w-4 h-4" />
            Publicar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-brand-muted/40 bg-white overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#161718' }}>
              Componentes
            </h2>
            <div className="space-y-2">
              {['Hero', 'Texto', 'Imagem', 'Botão', 'Formulário', 'Cards'].map((component) => (
                <div
                  key={component}
                  className="p-3 rounded-lg border border-brand-muted/40 text-sm font-medium cursor-move hover:bg-brand-muted/20 transition"
                  style={{ color: '#161718' }}
                >
                  {component}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 overflow-auto" style={{ backgroundColor: '#EBE6DA' }}>
          <div className="min-h-full p-8 flex items-center justify-center">
            <div className="bg-white rounded-xl border border-brand-muted/40 p-12 max-w-2xl w-full min-h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-brand-muted mb-2">Canvas — Arraste componentes aqui</p>
                <p className="text-xs text-brand-muted/60">
                  Selecione um componente à esquerda para começar a editar
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="w-64 border-l border-brand-muted/40 bg-white overflow-y-auto">
          <div className="p-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#161718' }}>
              Propriedades
            </h2>
            <div className="bg-brand-muted/10 p-4 rounded-lg text-center">
              <p className="text-xs text-brand-muted">
                Selecione um componente para editar suas propriedades
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
