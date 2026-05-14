'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { UserCircle, LogOut, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface GuestSidebarProps {
  name: string
  companyName: string
  embedded?: boolean
}

export function GuestSidebar({ name, companyName, embedded = false }: GuestSidebarProps) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const companySlug = params.companySlug as string
  const [isDark, setIsDark] = useState(false)

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

  async function handleSignOut() {
    await fetch('/api/guest/signout', { method: 'POST' })
    router.push('/login')
  }

  const galleryHref = `/${companySlug}/guest`
  const isActive = pathname === galleryHref || pathname.startsWith(`/${companySlug}/guest`)

  const asideStyle: React.CSSProperties = embedded
    ? { width: '100%', height: '100%', flexShrink: 0, backgroundColor: 'var(--sidebar-bg)', color: 'var(--brand-text)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
    : { width: '220px', height: '100vh', position: 'fixed', top: 0, left: 0, flexShrink: 0, backgroundColor: 'var(--sidebar-bg)', color: 'var(--brand-text)', flexDirection: 'column', overflow: 'hidden', zIndex: 40 }

  return (
    <aside
      className={embedded ? '' : 'hidden md:flex flex-col'}
      style={asideStyle}
    >
      <div style={{ padding: '16px 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Link href={galleryHref} style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '90px', height: '40px' }}>
          <Image
            src={isDark ? '/janus-logo-white.svg' : '/janus-logo.svg'}
            alt="Janus"
            width={90}
            height={40}
            priority
            style={{ objectFit: 'contain' }}
          />
        </Link>
      </div>

      <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Link
          href={galleryHref}
          className={cn(
            'flex flex-row items-center gap-3 px-3 py-2 rounded-lg transition-colors',
            isActive
              ? 'bg-sidebar-hover-bg text-sidebar-hover-text'
              : 'text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text'
          )}
        >
          <ImageIcon size={16} className="flex-shrink-0" />
          <span>Minhas Postagens</span>
        </Link>
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--brand-btn-light)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="flex items-center gap-3 px-3 py-2">
          <UserCircle size={32} style={{ flexShrink: 0, color: 'var(--sidebar-icon)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, color: 'var(--brand-text)' }}>
              {name}
            </p>
            <p style={{ fontSize: '11px', opacity: 0.6, margin: 0 }}>{companyName}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex flex-row items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
