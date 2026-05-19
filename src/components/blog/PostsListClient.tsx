'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus, Search, Trash2, Loader2, Newspaper, SlidersHorizontal, ListFilter,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
} from 'lucide-react'
import { deleteBlogPost } from '@/modules/blog/actions/deleteBlogPost'

interface Post {
  id: string
  title: string
  coverImageUrl: string | null
  publishedAt: Date
  authorName: string
  category: { id: string; name: string } | null
}

type SortKey = 'title' | 'category' | 'date' | 'author'
type SortDir = 'asc' | 'desc'
type VisibleColumn = 'category' | 'date' | 'author'

interface BlogPostsTableProps {
  posts: Post[]
  basePath: string
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleAll: () => void
  visibleColumns: Set<VisibleColumn>
  sortBy: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
  onDeletePost: (id: string) => void
}

function SortIndicator({ column, sortBy, sortDir }: { column: SortKey; sortBy: SortKey; sortDir: SortDir }) {
  if (sortBy !== column) {
    return (
      <span className="inline-flex flex-col ml-1 opacity-30">
        <ChevronUp size={9} />
        <ChevronDown size={9} />
      </span>
    )
  }
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="ml-1 inline text-brand-cta" />
    : <ChevronDown size={12} className="ml-1 inline text-brand-cta" />
}

function DeleteRowButton({ postId, onDeleted }: { postId: string; onDeleted: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm) { setConfirm(true); return }
    startTransition(async () => {
      await deleteBlogPost(postId)
      onDeleted(postId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={confirm ? 'Confirmar exclusão' : 'Excluir'}
      className={`p-1.5 rounded transition ${confirm ? 'text-destructive bg-destructive/10' : 'text-brand-muted hover:text-destructive hover:bg-destructive/10'}`}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}

export function BlogPostsTable({
  posts,
  basePath,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  visibleColumns,
  sortBy,
  sortDir,
  onSort,
  onDeletePost,
}: BlogPostsTableProps) {
  const allOnPageSelected = posts.length > 0 && posts.every((p) => selectedIds.has(p.id))

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Newspaper size={40} className="text-brand-muted opacity-40" />
        <p className="text-sm text-brand-muted">Nenhum artigo encontrado</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={onToggleAll}
                className="rounded border-border"
              />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">
              <button onClick={() => onSort('title')} className="flex items-center hover:text-brand-text transition">
                Detalhes <SortIndicator column="title" sortBy={sortBy} sortDir={sortDir} />
              </button>
            </th>
            {visibleColumns.has('category') && (
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                <button onClick={() => onSort('category')} className="flex items-center hover:text-brand-text transition">
                  Categoria <SortIndicator column="category" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
            )}
            {visibleColumns.has('date') && (
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                <button onClick={() => onSort('date')} className="flex items-center hover:text-brand-text transition">
                  Data de criação <SortIndicator column="date" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
            )}
            {visibleColumns.has('author') && (
              <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                <button onClick={() => onSort('author')} className="flex items-center hover:text-brand-text transition">
                  Autor <SortIndicator column="author" sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
            )}
            <th className="px-4 py-3 w-28" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post) => (
            <tr
              key={post.id}
              className={`hover:bg-brand-btn-light/20 transition ${selectedIds.has(post.id) ? 'bg-brand-cta/5' : ''}`}
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(post.id)}
                  onChange={() => onToggleSelect(post.id)}
                  className="rounded border-border"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-btn-light overflow-hidden flex-shrink-0">
                    {post.coverImageUrl ? (
                      <Image src={post.coverImageUrl} alt={post.title} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper size={16} className="text-brand-muted" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-brand-text line-clamp-2 max-w-[200px]">{post.title}</span>
                </div>
              </td>
              {visibleColumns.has('category') && (
                <td className="px-4 py-3 text-sm text-brand-muted">{post.category?.name ?? '—'}</td>
              )}
              {visibleColumns.has('date') && (
                <td className="px-4 py-3 text-sm text-brand-muted">
                  {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                </td>
              )}
              {visibleColumns.has('author') && (
                <td className="px-4 py-3 text-sm text-brand-muted">{post.authorName}</td>
              )}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <DeleteRowButton postId={post.id} onDeleted={onDeletePost} />
                  <Link
                    href={`${basePath}/blog/posts/${post.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-brand-text hover:bg-brand-btn-light/40 transition"
                  >
                    Gerenciar
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PostsListClientProps {
  posts: Post[]
  basePath: string
  projectId: string
}

const COLUMN_LABELS: Record<VisibleColumn, string> = {
  category: 'Categoria',
  date: 'Data de criação',
  author: 'Autor',
}

export function PostsListClient({ posts: initialPosts, basePath }: PostsListClientProps) {
  const [localPosts, setLocalPosts] = useState(initialPosts)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState<Set<VisibleColumn>>(new Set(['category', 'date', 'author']))
  const [columnMenuOpen, setColumnMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [bulkDeleting, startBulkDelete] = useTransition()
  const columnMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!columnMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setColumnMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [columnMenuOpen])

  const filtered = localPosts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.category?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      p.authorName.toLowerCase().includes(search.toLowerCase()),
  )

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
    else if (sortBy === 'category') cmp = (a.category?.name ?? '').localeCompare(b.category?.name ?? '')
    else if (sortBy === 'date') cmp = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    else if (sortBy === 'author') cmp = a.authorName.localeCompare(b.authorName)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
  const startRecord = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endRecord = Math.min(safePage * pageSize, sorted.length)

  function handleSort(key: SortKey) {
    setSortDir(sortBy === key ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortBy(key)
    setPage(1)
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePageSizeChange(value: number) {
    setPageSize(value)
    setPage(1)
    setSelectedIds(new Set())
  }

  function toggleColumn(col: VisibleColumn) {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col)
      else next.add(col)
      return next
    })
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleAll() {
    const pageIds = paginated.map((p) => p.id)
    const allSelected = pageIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  }

  function handleDeletePost(id: string) {
    setLocalPosts((prev) => prev.filter((p) => p.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirmBulkDelete) { setConfirmBulkDelete(true); return }
    const ids = Array.from(selectedIds)
    startBulkDelete(async () => {
      for (const id of ids) {
        await deleteBlogPost(id)
      }
      setLocalPosts((prev) => prev.filter((p) => !ids.includes(p.id)))
      setSelectedIds(new Set())
      setConfirmBulkDelete(false)
    })
  }

  function handleResetFilters() {
    setSearch('')
    setSortBy('date')
    setSortDir('desc')
    setPage(1)
  }

  const iconBtn = (active = false) =>
    `w-8 h-8 rounded-lg border flex items-center justify-center transition shrink-0 ${
      active
        ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
        : 'border-border text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/40'
    }`

  return (
    <div className="w-full">
      <div className="bg-card border border-border rounded-xl overflow-visible">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Link
            href={`${basePath}/blog/posts/new`}
            className="w-8 h-8 rounded-lg bg-brand-cta flex items-center justify-center text-white hover:bg-brand-cta-hover transition shrink-0"
            title="Novo Artigo"
          >
            <Plus size={16} />
          </Link>

          <div className="relative shrink-0" ref={columnMenuRef}>
            <button
              onClick={() => setColumnMenuOpen((v) => !v)}
              className={iconBtn(columnMenuOpen)}
              title="Visibilidade de colunas"
            >
              <SlidersHorizontal size={15} />
            </button>
            {columnMenuOpen && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                {(['category', 'date', 'author'] as VisibleColumn[]).map((col) => (
                  <label key={col} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-brand-btn-light/30 transition">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-border"
                    />
                    {COLUMN_LABELS[col]}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleResetFilters}
            className={iconBtn(!!search)}
            title="Limpar filtros"
          >
            <ListFilter size={15} />
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            title={
              selectedIds.size === 0
                ? 'Selecione artigos para excluir'
                : confirmBulkDelete
                  ? `Confirmar exclusão de ${selectedIds.size} artigos`
                  : `Excluir ${selectedIds.size} selecionados`
            }
            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition shrink-0 ${
              selectedIds.size === 0
                ? 'border-border text-brand-muted opacity-40 cursor-not-allowed'
                : confirmBulkDelete
                  ? 'border-destructive bg-destructive/10 text-destructive'
                  : 'border-border text-brand-muted hover:border-destructive hover:text-destructive hover:bg-destructive/10'
            }`}
          >
            {bulkDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>

          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Pesquisar por Artigo, Data de criação, Categoria, Autor"
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-brand-bg border border-border rounded-lg text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm text-brand-muted">Exibir</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background text-brand-text focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-brand-muted">registros</span>
          </div>

          <span className="text-sm text-brand-muted shrink-0 whitespace-nowrap">
            {sorted.length === 0
              ? 'Nenhum registro'
              : `Exibindo ${startRecord} a ${endRecord} de ${sorted.length} registros`}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-brand-muted whitespace-nowrap px-0.5">Página {safePage} de {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <BlogPostsTable
          posts={paginated}
          basePath={basePath}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
          visibleColumns={visibleColumns}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onDeletePost={handleDeletePost}
        />
      </div>
    </div>
  )
}
