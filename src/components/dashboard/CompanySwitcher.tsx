'use client'

import { useState } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

interface Company {
  companyId: string
  name: string
  slug: string
}

interface CompanySwitcherProps {
  companies: Company[]
  currentSlug: string
}

export function CompanySwitcher({ companies, currentSlug }: CompanySwitcherProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  if (companies.length <= 1) return null

  // oculta dentro do contexto de projeto (sites/[id] ou landing-pages/[id])
  const inProject = /\/dashboard\/(sites|landing-pages)\/[^/]+/.test(pathname)
  if (inProject) return null

  const current = companies.find((c) => c.slug === currentSlug) ?? companies[0]

  function handleSelect(slug: string) {
    setOpen(false)
    if (slug !== currentSlug) {
      router.push(`/${slug}/dashboard`)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-brand-btn-light transition"
      >
        <Building2 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
        <span className="max-w-[120px] truncate text-brand-text">{current?.name}</span>
        <ChevronDown className="w-3 h-3 text-brand-muted shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-semibold text-brand-muted uppercase tracking-wide">Empresas</p>
            </div>
            <div className="py-1">
              {companies.map((company) => (
                <button
                  key={company.companyId}
                  onClick={() => handleSelect(company.slug)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-brand-btn-light transition"
                >
                  <div className="w-6 h-6 rounded bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-brand-primary" />
                  </div>
                  <span className="flex-1 truncate text-brand-text font-medium">{company.name}</span>
                  {company.slug === currentSlug && (
                    <Check className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
