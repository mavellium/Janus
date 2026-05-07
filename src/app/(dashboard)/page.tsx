import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Zap, Globe, ChevronRight } from 'lucide-react'

export const metadata = { title: 'Dashboard — Janus' }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const firstName = session.user.email?.split('@')[0] || 'Usuário'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#161718' }}>
          Boas-vindas ao Janus, {firstName}!
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-muted">Suas tarefas</span>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#E74C3C' }}>
            3
          </span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden mb-8" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="p-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Transforme sua ideia em um site ou landing page — em minutos
            </h2>
            <p className="text-gray-300 text-sm mb-6">
              Converse com IA pública ou comum clique aqui
            </p>
            <button className="px-6 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition">
              Começar
            </button>
          </div>
          <div className="hidden md:block w-48 h-40 bg-gray-700 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-brand-muted/40">
          <div className="p-6 border-b border-brand-muted/40">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" style={{ color: '#514030' }} />
              <h3 className="text-lg font-semibold" style={{ color: '#161718' }}>
                Sites
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-brand-muted text-xs mb-1">Deletados %</p>
                <p className="font-semibold" style={{ color: '#161718' }}>
                  5%
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Buscas fi</p>
                <p className="font-semibold" style={{ color: '#161718' }}>
                  18
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Deletadas fi</p>
                <p className="font-semibold" style={{ color: '#161718' }}>
                  2
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-brand-muted/40">
            {[
              { name: 'Institucional Negro', status: 'Ativado' },
              { name: 'Institucional Negro', status: 'Ativado' },
            ].map((site, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-brand-muted/20 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded bg-gray-300"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {site.name}
                    </p>
                    <p className="text-xs text-brand-muted">{site.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs border border-brand-muted/60 rounded-lg hover:bg-brand-muted/10 transition text-brand-text">
                    Editar
                  </button>
                  <button className="p-1 hover:bg-brand-muted/20 rounded transition">
                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                  </button>
                </div>
              </div>
            ))}
            <div className="p-4 text-center">
              <button className="text-sm font-semibold text-brand-primary hover:opacity-80 transition">
                Gerenciar todos →
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-brand-muted/40">
          <div className="p-6 border-b border-brand-muted/40">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5" style={{ color: '#514030' }} />
              <h3 className="text-lg font-semibold" style={{ color: '#161718' }}>
                Landing Pages
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-brand-muted text-xs mb-1">Deletados %</p>
                <p className="font-semibold" style={{ color: '#161718' }}>
                  5%
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Buscas fi</p>
                <p className="font-semibold" style={{ color: '#161718' }}>
                  18
                </p>
              </div>
              <div>
                <p className="text-brand-muted text-xs mb-1">Deletadas fi</p>
                <p className="font-semibold" style={{ color: '#161718' }}>
                  2
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-brand-muted/40">
            {[
              { name: 'Venda LandingPage', status: 'Ativado' },
              { name: 'Venda LandingPage', status: 'Ativado' },
              { name: 'Venda LandingPage', status: 'Ativado' },
            ].map((page, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-brand-muted/20 transition">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded bg-gray-300"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {page.name}
                    </p>
                    <p className="text-xs text-brand-muted">{page.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 text-xs border border-brand-muted/60 rounded-lg hover:bg-brand-muted/10 transition text-brand-text">
                    Editar
                  </button>
                  <button className="p-1 hover:bg-brand-muted/20 rounded transition">
                    <ChevronRight className="w-4 h-4 text-brand-muted" />
                  </button>
                </div>
              </div>
            ))}
            <div className="p-4 text-center">
              <button className="text-sm font-semibold text-brand-primary hover:opacity-80 transition">
                Gerenciar todos →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
