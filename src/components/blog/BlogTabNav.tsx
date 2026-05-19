'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BlogTabNavProps {
  basePath: string
}

export function BlogTabNav({ basePath }: BlogTabNavProps) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Publicações', href: `${basePath}/posts` },
    { label: 'Categorias', href: `${basePath}/categories` },
    { label: 'Tags', href: `${basePath}/tags` },
  ]

  return (
    <div className="flex gap-1 mb-6">
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              isActive
                ? 'px-4 py-1.5 rounded-full text-sm font-medium bg-brand-cta text-white'
                : 'px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            }
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
