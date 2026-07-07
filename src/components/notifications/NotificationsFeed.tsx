'use client'

import { useMemo, useState } from 'react'
import { Bell, Rocket, ExternalLink, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReleaseBody } from '@/components/notifications/ReleaseBody'
import type { SystemRelease } from '@/modules/notifications/domain/release'

type ReleaseFilter = 'all' | 'stable' | 'prerelease'

const FILTER_OPTIONS: Array<{ value: ReleaseFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'stable', label: 'Estáveis' },
  { value: 'prerelease', label: 'Pré-releases' },
]

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' })
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ')
}

function monthLabel(publishedAt: string | null): string {
  if (!publishedAt) return 'Sem data'
  const label = monthFormatter.format(new Date(publishedAt))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function NotificationsFeed({
  releases,
  initialHasMore,
}: {
  releases: SystemRelease[]
  initialHasMore: boolean
}) {
  const [items, setItems] = useState(releases)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ReleaseFilter>('all')

  const latestId = items[0]?.id

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((release) => {
      if (filter === 'stable' && release.prerelease) return false
      if (filter === 'prerelease' && !release.prerelease) return false
      if (!term) return true
      return (
        release.tagName.toLowerCase().includes(term) ||
        (release.name?.toLowerCase().includes(term) ?? false) ||
        stripHtml(release.bodyHtml).toLowerCase().includes(term)
      )
    })
  }, [items, search, filter])

  const groups = useMemo(() => {
    const map = new Map<string, SystemRelease[]>()
    for (const release of filtered) {
      const label = monthLabel(release.publishedAt)
      const group = map.get(label)
      if (group) group.push(release)
      else map.set(label, [release])
    }
    return Array.from(map.entries())
  }, [filtered])

  async function loadMore() {
    setLoadingMore(true)
    setLoadError(false)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/notifications/releases?page=${nextPage}`)
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { releases: SystemRelease[]; hasMore: boolean }
      setItems((prev) => {
        const known = new Set(prev.map((release) => release.id))
        return [...prev, ...data.releases.filter((release) => !known.has(release.id))]
      })
      setHasMore(data.hasMore)
      setPage(nextPage)
    } catch {
      setLoadError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="release-card-in bg-card rounded-xl border border-brand-btn-light p-10 flex flex-col items-center gap-3 text-center">
        <Bell size={28} className="text-brand-muted" />
        <p className="text-sm text-brand-muted">
          Nenhuma atualização de versão disponível no momento.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="release-card-in mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por versão ou conteúdo..."
            className="w-full rounded-lg border border-brand-btn-light bg-card pl-9 pr-3 py-2 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/40 transition-shadow"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                filter === value
                  ? 'bg-brand-primary border-brand-primary text-white'
                  : 'border-brand-btn-light text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/40'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="release-card-in bg-card rounded-xl border border-brand-btn-light p-10 flex flex-col items-center gap-3 text-center">
          <Search size={28} className="text-brand-muted" />
          <p className="text-sm text-brand-muted">
            Nenhuma notificação encontrada para os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8">
          <div className="absolute left-[5px] sm:left-[7px] top-2 bottom-2 w-px bg-brand-btn-light" />

          <div className="flex flex-col gap-8">
            {groups.map(([label, groupReleases]) => (
              <section key={label}>
                <h3 className="relative mb-4 text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  <span className="absolute -left-6 sm:-left-8 top-1/2 -translate-y-1/2 w-[11px] h-[11px] sm:w-[15px] sm:h-[15px] rounded-full bg-brand-btn-light" />
                  {label}
                </h3>

                <div className="flex flex-col gap-4">
                  {groupReleases.map((release, index) => (
                    <article
                      key={release.id}
                      className="release-card-in relative bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6 transition-[box-shadow,border-color] duration-300 hover:shadow-lg hover:border-brand-primary/40"
                      style={{ animationDelay: `${Math.min(index, 8) * 80}ms` }}
                    >
                      <span className="absolute -left-[23px] sm:-left-[29px] top-7 w-[9px] h-[9px] sm:w-[11px] sm:h-[11px] rounded-full border-2 border-brand-primary bg-card" />

                      <header className="flex flex-wrap items-center gap-2 mb-1">
                        <Rocket size={16} className="text-brand-primary flex-shrink-0" />
                        <h2 className="text-lg font-semibold text-brand-text">
                          {release.tagName}
                        </h2>
                        {release.id === latestId && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full bg-brand-primary text-white px-2 py-0.5">
                            Atual
                          </span>
                        )}
                        {release.prerelease && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide rounded-full border border-brand-btn-light text-brand-muted px-2 py-0.5">
                            Pré-release
                          </span>
                        )}
                        <a
                          href={release.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver no GitHub"
                          className="ml-auto text-brand-muted hover:text-brand-text transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </header>

                      <p className="text-xs text-brand-muted mb-3">
                        {release.name && <span>{release.name}</span>}
                        {release.name && release.publishedAt && <span> · </span>}
                        {release.publishedAt && (
                          <time dateTime={release.publishedAt}>
                            {dateFormatter.format(new Date(release.publishedAt))}
                          </time>
                        )}
                      </p>

                      {release.bodyHtml ? (
                        <ReleaseBody html={release.bodyHtml} />
                      ) : (
                        <p className="text-sm text-brand-muted italic">
                          Sem notas de versão para esta atualização.
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition border border-brand-btn-light text-brand-text hover:bg-brand-btn-light/40 flex items-center gap-2 disabled:opacity-60"
              >
                {loadingMore && <Loader2 size={14} className="animate-spin" />}
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
              {loadError && (
                <p className="text-xs text-red-500">
                  Não foi possível carregar mais notificações. Tente novamente.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
