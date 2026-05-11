'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home, FileText, Globe, Zap, FileStack,
  Bell, Settings, LogOut, PanelLeftClose, PanelLeftOpen, UserCircle,
} from 'lucide-react'
import { updatePreferences } from '@/modules/users/actions/updatePreferences'
import { signOut } from 'next-auth/react'


interface SidebarProps {
  email: string
  image?: string | null
  initialCollapsed: boolean
  companyName?: string
}

export function Sidebar({ email, image, initialCollapsed, companyName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [, startTransition] = useTransition()
  const params = useParams()
  const pathname = usePathname()
  const companySlug = params.companySlug as string

  const userName = email.split('@')[0]

  const logoUrl = collapsed ? '/logo-min.svg' : '/janus-logo.svg'

  const MENU_ITEMS = [
    { label: 'Página Inicial', href: `/${companySlug}/dashboard`, icon: Home },
    { label: 'Resultados', href: `/${companySlug}/dashboard/results`, icon: FileText },
    { label: 'Sites', href: `/${companySlug}/dashboard/sites`, icon: Globe },
    { label: 'Landing Pages', href: `/${companySlug}/dashboard/landing-pages`, icon: Zap },
    { label: 'Faturas', href: `/${companySlug}/dashboard/invoices`, icon: FileStack },
  ]

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    startTransition(async () => {
      await updatePreferences({ sidebar_collapsed: next })
    })
  }

  const isActive = (href: string) =>
    pathname === href ||
    (href === `/${companySlug}/dashboard` && pathname === `/${companySlug}/dashboard`) ||
    (href.includes('/sites') && pathname.includes('/sites')) ||
    (href.includes('/landing-pages') && pathname.includes('/landing-pages')) ||
    (href.includes('/results') && pathname.includes('/results')) ||
    (href.includes('/invoices') && pathname.includes('/invoices')) ||
    (href.includes('/settings') && pathname.includes('/settings'))

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

  return (
    <aside
      style={{
        width: collapsed ? '80px' : '220px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--brand-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 300ms ease',
      }}
    >
      <div
        style={{
          padding: '16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        <Link
          href={`/${companySlug}/dashboard`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Dashboard"
        >
          <Image
            src={logoUrl}
            alt="Janus"
            width={collapsed ? 36 : 90}
            height={collapsed ? 36 : 90}
            priority
          />
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Minimizar sidebar"
            className={cn('flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-lg transition-colors text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text [&>svg]:text-sidebar-icon hover:[&>svg]:text-sidebar-hover-text')}
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 8px', flexShrink: 0 }}>
          <button
            onClick={toggleCollapsed}
            title="Expandir sidebar"
            className={cn('flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text [&>svg]:text-sidebar-icon hover:[&>svg]:text-sidebar-hover-text')}
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

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
        {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
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
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{companyName || 'Empresa'}</p>
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
