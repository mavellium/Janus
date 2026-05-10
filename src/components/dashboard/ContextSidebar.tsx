import Link from 'next/link'
import { ChevronLeft, FileText, BarChart3, BookOpen } from 'lucide-react'

interface ContextSidebarProps {
  companySlug: string
  projectId: string
  projectName: string
  projectType: 'LANDING_PAGE' | 'INSTITUTIONAL'
  currentSection?: 'pages' | 'analytics' | 'blog'
}

export function ContextSidebar({
  companySlug,
  projectId,
  projectName,
  projectType,
  currentSection,
}: ContextSidebarProps) {
  const basePath =
    projectType === 'LANDING_PAGE'
      ? `/${companySlug}/dashboard/landing-pages/${projectId}`
      : `/${companySlug}/dashboard/sites/${projectId}`

  const navItems = [
    { href: `${basePath}/pages`, label: 'Páginas', icon: FileText, id: 'pages' },
    { href: `${basePath}/analytics`, label: 'Resultados', icon: BarChart3, id: 'analytics' },
    { href: `${basePath}/blog`, label: 'Blog', icon: BookOpen, id: 'blog' },
  ]

  return (
    <aside className="w-64 bg-white border-r border-brand-muted/40 flex flex-col">
      <div className="p-6 border-b border-brand-muted/40">
        <Link href={`/${companySlug}/dashboard`} className="flex items-center gap-2 text-brand-primary hover:opacity-80 mb-4">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Voltar</span>
        </Link>
        <h2 className="text-sm font-semibold" style={{ color: '#161718' }}>
          {projectName}
        </h2>
        <p className="text-xs text-brand-muted mt-1">
          {projectType === 'LANDING_PAGE' ? 'Landing Page' : 'Site'}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map(({ href, label, icon: Icon, id }) => (
            <li key={id}>
              <Link
                href={href}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition"
                style={{
                  backgroundColor: currentSection === id ? '#ebe6da' : 'transparent',
                  color: '#161718',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
