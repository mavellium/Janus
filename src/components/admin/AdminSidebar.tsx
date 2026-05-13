'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, Users, Settings, LogOut,
  PanelLeftClose, PanelLeftOpen, UserCircle, Code2, Shield,
} from 'lucide-react'
import { signOut } from 'next-auth/react'

interface AdminSidebarProps {
  email: string
  image?: string | null
  embedded?: boolean
}

export function AdminSidebar({ email, image, embedded = false }: AdminSidebarProps) {
  const [collapsedState, setCollapsedState] = useState(false)
  const collapsed = embedded ? false : collapsedState
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '80px' : '220px')
  }, [collapsed])

  const NAV_ITEMS = [
    { label: 'Dashboard', href: '/dashboard-admin', icon: LayoutDashboard },
    { label: 'Empresas', href: '/dashboard-admin/companies', icon: Building2 },
    { label: 'Desenvolvedores', href: '/dashboard-admin/developers', icon: Code2 },
    { label: 'Usuários', href: '/dashboard-admin/users', icon: Users },
    { label: 'Logs', href: '/dashboard-admin/logs', icon: Shield },
    { label: 'Configurações', href: '/dashboard-admin/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href === '/dashboard-admin') return false
    return pathname.startsWith(`${href}/`)
  }

  const itemClass = (href: string) => cn(
    'flex w-full rounded-lg transition-colors',
    collapsed
      ? 'flex-col items-center justify-center px-1 py-2 gap-0.5'
      : 'flex-row items-center gap-3 px-3 py-2',
    isActive(href)
      ? 'bg-sidebar-hover-bg text-sidebar-hover-text [&>svg]:text-sidebar-hover-text'
      : 'text-sidebar-icon [&>svg]:text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text [&>svg]:hover:text-sidebar-hover-text'
  )

  const asideStyle: React.CSSProperties = embedded
    ? { width: '100%', height: '100%', flexShrink: 0, backgroundColor: 'var(--sidebar-bg)', color: 'var(--brand-text)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { width: collapsed ? '80px' : '220px', height: '100vh', position: 'fixed', top: 0, left: 0, flexShrink: 0, backgroundColor: 'var(--sidebar-bg)', color: 'var(--brand-text)', flexDirection: 'column', overflow: 'hidden', transition: 'width 300ms ease', zIndex: 40 }

  return (
    <aside
      className={embedded ? '' : 'hidden md:flex'}
      style={asideStyle}
    >
      <div
        style={{
          padding: collapsed ? '8px' : '16px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        <Link
          href="/dashboard-admin"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', width: '90px', height: '40px' }}
          title="Admin Dashboard"
        >
          <Image
            src="/janus-logo.svg"
            alt="Janus"
            width={90}
            height={90}
            priority
            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', opacity: collapsed ? 0 : 1, transition: 'opacity 200ms ease' }}
          />
          <Image
            src="/logo-min.svg"
            alt="Janus"
            width={36}
            height={36}
            priority
            style={{ position: 'absolute', width: '36px', height: '36px', objectFit: 'contain', opacity: collapsed ? 1 : 0, transition: 'opacity 200ms ease' }}
          />
        </Link>
        {!collapsed && !embedded && (
          <button
            onClick={() => setCollapsedState(true)}
            title="Minimizar"
            className="flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-lg transition-colors text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 py-1.5 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-muted">
            Admin Panel
          </span>
        </div>
      )}

      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {collapsed && !embedded && (
          <button
            onClick={() => setCollapsedState(false)}
            title="Expandir"
            className={cn('flex w-full rounded-lg transition-colors flex-col items-center justify-center px-1 py-2 gap-0.5 text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text')}
          >
            <PanelLeftOpen size={16} />
            <span className="text-[10px] text-center leading-tight w-full">Expandir</span>
          </button>
        )}
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} title={collapsed ? label : undefined} className={itemClass(href)}>
            <Icon size={16} className="flex-shrink-0" />
            {collapsed
              ? <span className="text-[10px] text-center leading-tight line-clamp-2 w-full">{label}</span>
              : <span>{label}</span>
            }
          </Link>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--brand-btn-light)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          className={cn(
            'rounded-lg',
            collapsed ? 'flex justify-center p-2' : 'flex items-center gap-3 px-3 py-2'
          )}
        >
          {image ? (
            <div style={{ position: 'relative', flexShrink: 0, width: '32px', height: '32px' }}>
              <Image
                src={image}
                alt={email}
                fill
                sizes="32px"
                style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-primary)' }}
                priority
              />
            </div>
          ) : (
            <UserCircle size={32} style={{ flexShrink: 0, color: 'var(--sidebar-icon)' }} />
          )}
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, color: 'var(--brand-text)' }}>
                {email}
              </p>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Administrador</p>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'flex w-full rounded-lg transition-colors',
            collapsed
              ? 'flex-col items-center justify-center px-1 py-2 gap-0.5'
              : 'flex-row items-center gap-3 px-3 py-2',
            'text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text'
          )}
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
