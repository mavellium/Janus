import { auth } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Home, FileText, Globe, Zap, BookOpen, FileStack, Bell, Settings, LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth'

const MENU_ITEMS = [
  { label: 'Página Inicial', href: '/dashboard', icon: Home },
  { label: 'Resultados', href: '/dashboard/results', icon: FileText },
  { label: 'Sites', href: '/dashboard/sites', icon: Globe },
  { label: 'Landing Pages', href: '/dashboard/landing-pages', icon: Zap },
  { label: 'Blog', href: '/dashboard/blog', icon: BookOpen },
  { label: 'Faturas', href: '/dashboard/invoices', icon: FileStack },
]

export async function Sidebar() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userName = session.user.email?.split('@')[0] || 'Usuário'

  return (
    <aside
      className="w-48 min-h-screen flex flex-col border-r"
      style={{ backgroundColor: '#C8C8C8', color: '#161718' }}
    >
      <div className="p-6 border-b" style={{ borderColor: '#161718' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#514030' }}>
            J
          </div>
          <span className="text-lg font-semibold">Janus</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium hover:bg-black/10"
            style={{
              color: '#161718',
            }}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2" style={{ borderColor: '#161718' }}>
        <button
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-black/10"
          style={{ color: '#161718' }}
        >
          <Bell className="w-4 h-4" />
          <span>Notificações</span>
        </button>
        <button
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-black/10"
          style={{ color: '#161718' }}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações</span>
        </button>
      </div>

      <div className="p-4 border-t" style={{ borderColor: '#161718' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session.user.email}</p>
            <p className="text-xs opacity-70">Usuário</p>
          </div>
        </div>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: '#161718' }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
