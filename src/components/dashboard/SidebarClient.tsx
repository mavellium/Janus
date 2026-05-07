'use client'

import { useOptimistic, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Home, FileText, Globe, Zap, BookOpen, FileStack,
  Bell, Settings, LogOut, PanelLeftClose, PanelLeftOpen, UserCircle,
} from 'lucide-react'
import { updatePreferences } from '@/modules/users/actions/updatePreferences'
import { signOut } from 'next-auth/react'

const MENU_ITEMS = [
  { label: 'Página Inicial', href: '/dashboard', icon: Home },
  { label: 'Resultados', href: '/dashboard/results', icon: FileText },
  { label: 'Sites', href: '/dashboard/sites', icon: Globe },
  { label: 'Landing Pages', href: '/dashboard/landing-pages', icon: Zap },
  { label: 'Blog', href: '/dashboard/blog', icon: BookOpen },
  { label: 'Faturas', href: '/dashboard/invoices', icon: FileStack },
]

const BOTTOM_ITEMS = [
  { label: 'Notificações', icon: Bell },
  { label: 'Configurações', icon: Settings },
]

interface SidebarClientProps {
  email: string
  image?: string | null
  defaultCollapsed: boolean
}

export function SidebarClient({ email, image, defaultCollapsed }: SidebarClientProps) {
  const [, startTransition] = useTransition()
  const [collapsed, setCollapsed] = useOptimistic(defaultCollapsed)

  const userName = email.split('@')[0]

  function toggleCollapsed() {
    const next = !collapsed
    startTransition(async () => {
      setCollapsed(next)
      await updatePreferences({ sidebar_collapsed: next })
    })
  }

  const itemStyle = (isCollapsed: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isCollapsed ? '10px 0' : '10px 12px',
    justifyContent: isCollapsed ? 'center' as const : 'flex-start' as const,
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--sidebar-icon)',
    transition: 'background-color 150ms, color 150ms',
    width: '100%',
    whiteSpace: 'nowrap' as const,
  })

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '220px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--brand-text)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 200ms ease',
        overflow: 'hidden',
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
          href="/dashboard"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          title="Dashboard"
        >
          <Image
            src="/janus-logo.svg"
            alt="Janus"
            width={collapsed ? 28 : 48}
            height={collapsed ? 28 : 48}
            priority
            style={{ flexShrink: 0, transition: 'width 200ms ease, height 200ms ease' }}
          />
        </Link>

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Minimizar sidebar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--sidebar-icon)',
              flexShrink: 0,
              transition: 'background-color 150ms, color 150ms',
            }}
            className="sidebar-link"
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
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--sidebar-icon)',
              transition: 'background-color 150ms, color 150ms',
            }}
            className="sidebar-link"
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
            style={itemStyle(collapsed)}
            className="sidebar-link"
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {BOTTOM_ITEMS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            title={collapsed ? label : undefined}
            style={itemStyle(collapsed)}
            className="sidebar-link"
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: collapsed ? '12px 8px' : '12px 16px',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          {image ? (
            <Image
              src={image}
              alt={userName}
              width={32}
              height={32}
              style={{ borderRadius: '50%', flexShrink: 0 }}
            />
          ) : (
            <UserCircle
              size={32}
              style={{ flexShrink: 0, color: 'var(--sidebar-icon)' }}
            />
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
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Usuário</p>
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sair' : undefined}
          style={itemStyle(collapsed)}
          className="sidebar-link"
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
