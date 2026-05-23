'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, FileText, Globe, Zap, FileStack,
  Bell, Settings, LogOut, PanelLeftClose, PanelLeftOpen, UserCircle,
  ChevronLeft, BarChart3, BookOpen, Code2,
} from 'lucide-react'
import { updatePreferences } from '@/modules/users/actions/updatePreferences'
import { signOut } from 'next-auth/react'


interface SidebarProps {
  email: string
  name?: string | null
  image?: string | null
  initialCollapsed: boolean
  companyName?: string
  embedded?: boolean
}

export function Sidebar({ email, name, image, initialCollapsed, companyName, embedded = false }: SidebarProps) {
  const [collapsedState, setCollapsedState] = useState(embedded ? false : initialCollapsed)
  const collapsed = embedded ? false : collapsedState
  const [isDark, setIsDark] = useState(false)
  const [blogEnabled, setBlogEnabled] = useState(true)
  const [, startTransition] = useTransition()
  const params = useParams()
  const pathname = usePathname()
  const companySlug = params.companySlug as string
  const siteId = params.siteId as string | undefined
  const lpId = params.lpId as string | undefined

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '80px' : '220px')
  }, [collapsed])

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    checkDarkMode()

    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  const userName = email.split('@')[0]

  const projectId = siteId || lpId
  const isInProjectContext = !!projectId
  const basePath = siteId
    ? `/${companySlug}/dashboard/sites/${siteId}`
    : `/${companySlug}/dashboard/landing-pages/${lpId}`
  const backPath = siteId
    ? `/${companySlug}/dashboard/sites`
    : `/${companySlug}/dashboard/landing-pages`

  useEffect(() => {
    const projectId = siteId || lpId
    if (!projectId) return

    fetch(`/api/projects/${projectId}/blog-enabled`)
      .then(res => res.json())
      .then(data => setBlogEnabled(data.blogEnabled ?? true))
      .catch(() => setBlogEnabled(true))
  }, [siteId, lpId])

  const MAIN_ITEMS = [
    { label: 'Página Inicial', href: `/${companySlug}/dashboard`, icon: Home },
    { label: 'Resultados', href: `/${companySlug}/dashboard/results`, icon: FileText },
    { label: 'Sites', href: `/${companySlug}/dashboard/sites`, icon: Globe },
    { label: 'Landing Pages', href: `/${companySlug}/dashboard/landing-pages`, icon: Zap },
    { label: 'Faturas', href: `/${companySlug}/dashboard/invoices`, icon: FileStack },
  ]

  const PROJECT_ITEMS = [
    { label: 'Páginas', href: `${basePath}/pages`, icon: FileText },
    { label: 'Resultados', href: `${basePath}/analytics`, icon: BarChart3 },
  ]

  const menuItems = isInProjectContext ? PROJECT_ITEMS : MAIN_ITEMS

  function toggleCollapsed() {
    const next = !collapsedState
    setCollapsedState(next)
    startTransition(async () => {
      await updatePreferences({ sidebar_collapsed: next })
    })
  }

  const isActive = (href: string) => {
    if (!href) return false
    if (isInProjectContext) return pathname.startsWith(href)
    return pathname === href ||
      (href === `/${companySlug}/dashboard` && pathname === `/${companySlug}/dashboard`) ||
      (href.includes('/sites') && pathname.includes('/sites') && !href.includes('/landing-pages')) ||
      (href.includes('/landing-pages') && pathname.includes('/landing-pages')) ||
      (href.includes('/results') && pathname.includes('/results')) ||
      (href.includes('/invoices') && pathname.includes('/invoices')) ||
      (href.includes('/settings') && pathname.includes('/settings'))
  }

  const navItemClasses = (href: string) => cn(
    'flex w-full rounded-lg transition-colors',
    collapsed
      ? 'flex-col items-center justify-center px-1 py-2 gap-0.5'
      : 'flex-row items-center gap-3 px-3 py-2',
    isActive(href)
      ? 'bg-sidebar-hover-bg text-sidebar-hover-text [&>svg]:text-sidebar-hover-text'
      : 'text-sidebar-icon [&>svg]:text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text [&>svg]:hover:text-sidebar-hover-text'
  )

  const utilItemClasses = (active = false) => cn(
    'flex w-full rounded-lg transition-colors',
    collapsed
      ? 'flex-col items-center justify-center px-1 py-2 gap-0.5'
      : 'flex-row items-center gap-3 px-3 py-2',
    active
      ? 'bg-sidebar-hover-bg text-sidebar-hover-text [&>svg]:text-sidebar-hover-text'
      : 'text-sidebar-icon [&>svg]:text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text [&>svg]:hover:text-sidebar-hover-text'
  )

  const asideStyle: React.CSSProperties = embedded
    ? {
        width: '100%',
        height: '100%',
        flexShrink: 0,
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--brand-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        width: collapsed ? '80px' : '220px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        flexShrink: 0,
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--brand-text)',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 300ms ease',
        zIndex: 40,
      }

  return (
    <aside
      className={embedded ? '' : 'hidden md:flex'}
      style={asideStyle}
    >
      <div
        style={{
          padding: collapsed ? '8px 8px' : '16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        <Link
          href={`/${companySlug}/dashboard`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', width: '90px', height: '40px' }}
          title="Dashboard"
        >
          <Image
            src={isDark ? '/janus-logo-white.svg' : '/janus-logo.svg'}
            alt="Janus"
            width={90}
            height={90}
            priority
            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', opacity: collapsed ? 0 : 1, transition: 'opacity 200ms ease' }}
          />
          <Image
            src={isDark ? '/janus-logo-min-white.svg' : '/logo-min.svg'}
            alt="Janus"
            width={36}
            height={36}
            priority
            style={{ position: 'absolute', width: '36px', height: '36px', objectFit: 'contain', opacity: collapsed ? 1 : 0, transition: 'opacity 200ms ease' }}
          />
        </Link>
        {!collapsed && !embedded && (
          <button
            onClick={toggleCollapsed}
            title="Minimizar sidebar"
            className={cn('flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-lg transition-colors text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text [&>svg]:hover:text-sidebar-hover-text')}
          >
            <PanelLeftClose size={16} className="text-sidebar-icon" />
          </button>
        )}
      </div>

      <nav
        style={{
          flex: 1,
          padding: '8px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {collapsed && !embedded && (
          <button
            onClick={toggleCollapsed}
            title="Expandir sidebar"
            className={navItemClasses('')}
          >
            <PanelLeftOpen size={16} className="flex-shrink-0" />
            <span className="text-[10px] text-center leading-tight w-full">Expandir</span>
          </button>
        )}
        {isInProjectContext && (
          <Link
            href={backPath}
            className={utilItemClasses()}
          >
            <ChevronLeft size={16} className="flex-shrink-0" />
            {collapsed
              ? <span className="text-[10px] text-center leading-tight w-full">Voltar</span>
              : <span>← Voltar</span>
            }
          </Link>
        )}
        {menuItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={navItemClasses(href)}
          >
            <Icon size={16} className="flex-shrink-0" />
            {collapsed
              ? <span className="text-[10px] text-center leading-tight line-clamp-2 w-full">{label}</span>
              : <span>{label}</span>
            }
          </Link>
        ))}

        {isInProjectContext && siteId && (
          <Link
            href={`${basePath}/scripts`}
            title={collapsed ? 'Scripts' : undefined}
            className={navItemClasses(`${basePath}/scripts`)}
          >
            <Code2 size={16} className="flex-shrink-0" />
            {collapsed
              ? <span className="text-[10px] text-center leading-tight w-full">Scripts</span>
              : <span>Scripts</span>
            }
          </Link>
        )}

        {isInProjectContext && blogEnabled && (
          <Link
            href={`${basePath}/blog`}
            title={collapsed ? 'Blog' : undefined}
            className={navItemClasses(`${basePath}/blog`)}
          >
            <BookOpen size={16} className="flex-shrink-0" />
            {collapsed
              ? <span className="text-[10px] text-center leading-tight w-full">Blog</span>
              : <span>Blog</span>
            }
          </Link>
        )}
      </nav>

      <div style={{ padding: '8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button
          title={collapsed ? 'Notificações' : undefined}
          className={utilItemClasses()}
        >
          <Bell size={16} className="flex-shrink-0" />
          {collapsed
            ? <span className="text-[10px] text-center leading-tight w-full">Alertas</span>
            : <span>Notificações</span>
          }
        </button>
        <Link
          href={`/${companySlug}/dashboard/settings`}
          title={collapsed ? 'Configurações' : undefined}
          className={utilItemClasses(pathname.includes('/settings'))}
        >
          <Settings size={16} className="flex-shrink-0" />
          {collapsed
            ? <span className="text-[10px] text-center leading-tight w-full">Config.</span>
            : <span>Configurações</span>
          }
        </Link>
      </div>

      <div
        style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--brand-btn-light)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Link
          href={`/${companySlug}/dashboard/settings`}
          className={cn(
            'rounded-lg transition-colors',
            collapsed
              ? 'flex justify-center p-2'
              : 'flex items-center gap-3 px-3 py-2'
          )}
        >
          {image && (image.startsWith('http') || image.startsWith('/')) ? (
            <div
              style={{
                position: 'relative',
                flexShrink: 0,
                width: '32px',
                height: '32px',
              }}
            >
              <Image
                src={image}
                alt={userName}
                fill
                sizes="32px"
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--brand-primary)'
                }}
                priority
              />
            </div>
          ) : (
            <UserCircle size={32} style={{ flexShrink: 0, color: 'var(--sidebar-icon)' }} />
          )}
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                  color: 'var(--brand-text)',
                }}
              >
                {email}
              </p>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{name || companyName || 'Empresa'}</p>
            </div>
          )}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sair' : undefined}
          className={utilItemClasses()}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {collapsed
            ? <span className="text-[10px] text-center leading-tight w-full">Sair</span>
            : <span>Sair</span>
          }
        </button>
      </div>
    </aside>
  )
}
