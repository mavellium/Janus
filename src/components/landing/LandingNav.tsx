'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#cms', label: 'Conteúdo' },
  { href: '#seo', label: 'SEO' },
  { href: '#ia', label: 'IA' },
  { href: '#operacao', label: 'Recursos' },
  { href: '#precos', label: 'Planos' },
  { href: '#perguntas', label: 'Perguntas' },
]

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'lp-nav-blur border-b border-brand-btn-light'
          : 'border-b border-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Janus">
          <Image
            src="/janus-logo.svg"
            alt="Janus"
            width={127}
            height={56}
            priority
            className="h-8 w-auto dark:hidden"
          />
          <Image
            src="/janus-logo-white.svg"
            alt=""
            aria-hidden
            width={127}
            height={56}
            className="hidden h-8 w-auto dark:block"
          />
        </Link>

        <div className="hidden items-center gap-5 md:flex lg:gap-7">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-brand-muted transition-colors hover:text-brand-text"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-brand-text transition-colors hover:bg-brand-btn-light"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="inline-flex h-10 items-center rounded-lg bg-brand-cta px-4 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover"
          >
            Acessar o painel
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-text transition-colors hover:bg-brand-btn-light md:hidden"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-brand-btn-light bg-brand-bg px-4 pb-5 pt-3 md:hidden">
          <div className="flex flex-col">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-sm text-brand-muted transition-colors hover:bg-brand-btn-light hover:text-brand-text"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="mt-3 inline-flex h-12 items-center justify-center rounded-lg bg-brand-cta px-4 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover"
            >
              Acessar o painel
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
