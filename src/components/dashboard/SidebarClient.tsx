'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Home, FileText, Globe, Zap, BookOpen, FileStack, Bell, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
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

interface SidebarClientProps {
  email: string
  image?: string | null
  defaultCollapsed: boolean
}

export function SidebarClient({ email, image, defaultCollapsed }: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  const userName = email.split('@')[0]

  async function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    await updatePreferences({ sidebar_collapsed: next })
  }

  return (
    <aside
      style={{
        width: collapsed ? '64px' : '192px',
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
          padding: collapsed ? '20px 0' : '20px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Image
            src="/janus-logo.svg"
            alt="Janus"
            width={32}
            height={32}
            priority
            style={{ flexShrink: 0 }}
          />
          {!collapsed && (
            <span style={{ fontSize: '16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Janus
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--sidebar-icon)',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--sidebar-icon)',
            }}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: '8px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--sidebar-icon)',
              transition: 'background-color 150ms, color 150ms',
              whiteSpace: 'nowrap',
            }}
            className="sidebar-link"
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      <div style={{ padding: '8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {[
          { label: 'Notificações', icon: Bell },
          { label: 'Configurações', icon: Settings },
        ].map(({ label, icon: Icon }) => (
          <button
            key={label}
            title={collapsed ? label : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--sidebar-icon)',
              transition: 'background-color 150ms, color 150ms',
              width: '100%',
              whiteSpace: 'nowrap',
            }}
            className="sidebar-link"
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: collapsed ? '12px 0' : '12px 16px',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {image ? (
              <Image
                src={image}
                alt={userName}
                width={32}
                height={32}
                style={{ borderRadius: '50%', flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {email}
              </p>
              <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>Usuário</p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sair' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: collapsed ? '10px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: 'var(--sidebar-icon)',
            transition: 'background-color 150ms, color 150ms',
            width: '100%',
            whiteSpace: 'nowrap',
          }}
          className="sidebar-link"
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  )
}
