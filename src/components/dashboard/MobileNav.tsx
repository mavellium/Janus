'use client'

import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface MobileNavProps {
  children: React.ReactNode
  logoHref?: string
}

export function MobileNav({ children, logoHref = '/' }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false)
  }, [pathname])

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 bg-brand-bg border-b border-border">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Abrir menu"
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-sidebar-icon hover:bg-sidebar-hover-bg hover:text-sidebar-hover-text transition"
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 max-w-[85vw] p-0 overflow-y-auto">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          {children}
        </SheetContent>
      </Sheet>
      <Link href={logoHref} aria-label="Início">
        <Image
          src="/janus-logo.svg"
          alt="Janus"
          width={72}
          height={32}
          priority
          style={{ height: '32px', width: 'auto' }}
        />
      </Link>
    </header>
  )
}
