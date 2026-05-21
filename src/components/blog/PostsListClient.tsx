'use client'

import { useMemo, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus, Search, Trash2, Loader2, Newspaper, SlidersHorizontal, ListFilter,
  ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pencil, GripVertical, X,
} from 'lucide-react'
import { deleteBlogPost } from '@/modules/blog/actions/deleteBlogPost'

interface PostCategory {
  category: { id: string; name: string; parentId: string | null }
}

interface PostAuthor {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Post {
  id: string
  title: string
  coverImageUrl: string | null
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: Date | null
  authorName: string
  author: PostAuthor | null
  categories: PostCategory[]
}

type SortKey = 'title' | 'category' | 'date' | 'author'
type SortDir = 'asc' | 'desc'
type VisibleColumn = 'category' | 'date' | 'author'

const COLUMN_LABELS: Record<VisibleColumn, string> = {
  category: 'Categoria',
  date: 'Data de Publicação',
  author: 'Autor',
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

interface BlogPostsTableProps {
  posts: Post[]
  basePath: string
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleAll: () => void
  visibleColumns: Set<VisibleColumn>
  columnOrder: VisibleColumn[]
  sortBy: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

function getAuthorDisplay(post: Post) {
  return post.author?.name ?? post.author?.email ?? post.authorName
}

function getFirstCategoryName(post: Post) {
  return post.categories[0]?.category.name ?? null
}

export function BlogPostsTable({
  posts,
  basePath,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  visibleColumns,
  columnOrder,
  sortBy,
  sortDir,
  onSort,
}: BlogPostsTableProps) {
  const allOnPageSelected = posts.length > 0 && posts.every((p) => selectedIds.has(p.id))
  const orderedVisibleCols = columnOrder.filter((c) => visibleColumns.has(c))

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
            {orderedVisibleCols.map((col) => (
              <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">
                <button
                  onClick={() => onSort(col as SortKey)}
                  className="flex items-center hover:text-brand-text transition"
                >
                  {COLUMN_LABELS[col]} <SortIndicator column={col as SortKey} sortBy={sortBy} sortDir={sortDir} />
                </button>
              </th>
            ))}
            <th className="px-4 py-3 w-12" />
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
              <td className="px-4 py-3 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-btn-light overflow-hidden flex-shrink-0">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt={post.title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper size={16} className="text-brand-muted" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-brand-text line-clamp-2 max-w-xs">{post.title}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded w-fit ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-muted text-brand-muted'
                      }`}
                    >
                      {post.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                </div>
              </td>
              {orderedVisibleCols.map((col) => (
                <td key={col} className="px-4 py-3 text-sm text-brand-muted">
                  {col === 'category' && (getFirstCategoryName(post) ?? '—')}
                  {col === 'author' && (getAuthorDisplay(post) || '—')}
                  {col === 'date' && (
                    post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('pt-BR')
                      : <span className="text-brand-muted/60 italic">Rascunho</span>
                  )}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Link
                    href={`${basePath}/blog/posts/${post.id}/edit`}
                    className="p-1.5 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/40 transition"
                    title="Editar"
                  >
                    <Pencil size={14} />
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

export function PostsListClient({ posts: initialPosts, basePath }: PostsListClientProps) {
  const [localPosts, setLocalPosts] = useState(initialPosts)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [visibleColumns, setVisibleColumns] = useState<Set<VisibleColumn>>(new Set(['category', 'date', 'author']))
  const [columnOrder, setColumnOrder] = useState<VisibleColumn[]>(['category', 'date', 'author'])
  const [draggingColumn, setDraggingColumn] = useState<VisibleColumn | null>(null)
  const [columnMenuOpen, setColumnMenuOpen] = useState(false)
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL')
  const [filterAuthorId, setFilterAuthorId] = useState('')
  const [filterRootCategoryId, setFilterRootCategoryId] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)
  const [bulkDeleting, startBulkDelete] = useTransition()
  const columnMenuRef = useRef<HTMLDivElement>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)
  const cancelBulkRef = useRef<HTMLButtonElement>(null)

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

  useEffect(() => {
    if (!filterMenuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [filterMenuOpen])

  useEffect(() => {
    if (bulkDeleteModalOpen) {
      cancelBulkRef.current?.focus()
    }
  }, [bulkDeleteModalOpen])

  const authorOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of localPosts) {
      const id = p.author?.id
      const label = p.author?.name ?? p.author?.email ?? p.authorName
      if (id && label) map.set(id, label)
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [localPosts])

  const rootCategoryOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of localPosts) {
      for (const pc of p.categories) {
        if (pc.category.parentId === null) {
          map.set(pc.category.id, pc.category.name)
        }
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [localPosts])

  const filtered = useMemo(() => {
    return localPosts.filter((p) => {
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false
      if (filterAuthorId && p.author?.id !== filterAuthorId) return false
      if (filterRootCategoryId) {
        const hasRoot = p.categories.some(
          (pc) => pc.category.id === filterRootCategoryId && pc.category.parentId === null,
        )
        if (!hasRoot) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const authorStr = getAuthorDisplay(p).toLowerCase()
        const catStr = getFirstCategoryName(p)?.toLowerCase() ?? ''
        if (
          !p.title.toLowerCase().includes(q) &&
          !authorStr.includes(q) &&
          !catStr.includes(q)
        ) return false
      }
      return true
    })
  }, [localPosts, search, filterStatus, filterAuthorId, filterRootCategoryId])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortBy === 'category')
        cmp = (getFirstCategoryName(a) ?? '').localeCompare(getFirstCategoryName(b) ?? '')
      else if (sortBy === 'date') {
        const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : Infinity
        const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : Infinity
        cmp = ta - tb
      } else if (sortBy === 'author')
        cmp = getAuthorDisplay(a).localeCompare(getAuthorDisplay(b))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortBy, sortDir])

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

  function handleDragStart(col: VisibleColumn) {
    setDraggingColumn(col)
  }

  function handleDrop(targetCol: VisibleColumn) {
    if (!draggingColumn || draggingColumn === targetCol) return
    setColumnOrder((prev) => {
      const next = [...prev]
      const fromIdx = next.indexOf(draggingColumn)
      const toIdx = next.indexOf(targetCol)
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, draggingColumn)
      return next
    })
    setDraggingColumn(null)
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

  function handleResetFilters() {
    setSearch('')
    setFilterStatus('ALL')
    setFilterAuthorId('')
    setFilterRootCategoryId('')
    setSortBy('date')
    setSortDir('desc')
    setPage(1)
  }

  function executeBulkDelete() {
    const ids = Array.from(selectedIds)
    startBulkDelete(async () => {
      for (const id of ids) {
        await deleteBlogPost(id)
      }
      setLocalPosts((prev) => prev.filter((p) => !ids.includes(p.id)))
      setSelectedIds(new Set())
      setBulkDeleteModalOpen(false)
    })
  }

  const activeFilterCount = [filterStatus !== 'ALL', !!filterAuthorId, !!filterRootCategoryId].filter(Boolean).length
  const hasActiveFilters = !!search || activeFilterCount > 0

  const iconBtn = (active = false) =>
    `w-8 h-8 rounded-lg border flex items-center justify-center transition shrink-0 ${
      active
        ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
        : 'border-border text-brand-muted hover:text-brand-text hover:bg-brand-btn-light/40'
    }`

  return (
    <>
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
                <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                  {columnOrder.map((col) => (
                    <div
                      key={col}
                      draggable
                      onDragStart={() => handleDragStart(col)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(col)}
                      onDragEnd={() => setDraggingColumn(null)}
                      className={`flex items-center gap-2 px-3 py-2 text-sm cursor-grab hover:bg-brand-btn-light/30 transition select-none ${
                        draggingColumn === col ? 'opacity-50' : ''
                      }`}
                    >
                      <GripVertical size={12} className="text-brand-muted/50 flex-shrink-0" />
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col)}
                        onChange={() => toggleColumn(col)}
                        className="rounded border-border flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {COLUMN_LABELS[col]}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative shrink-0" ref={filterMenuRef}>
              <button
                onClick={() => setFilterMenuOpen((v) => !v)}
                className={`relative ${iconBtn(filterMenuOpen || hasActiveFilters)}`}
                title="Filtros"
              >
                <ListFilter size={15} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {filterMenuOpen && (
                <div className="absolute top-full left-0 mt-1 z-20 bg-card border border-border rounded-lg shadow-lg p-3 w-56">
                  <p className="text-[11px] font-semibold text-brand-muted uppercase tracking-widest mb-3">Filtrar por</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-brand-text">Status</label>
                      <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value as 'ALL' | 'DRAFT' | 'PUBLISHED'); setPage(1) }}
                        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="ALL">Todos</option>
                        <option value="DRAFT">Rascunho</option>
                        <option value="PUBLISHED">Publicado</option>
                      </select>
                    </div>
                    {authorOptions.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-brand-text">Autor</label>
                        <select
                          value={filterAuthorId}
                          onChange={(e) => { setFilterAuthorId(e.target.value); setPage(1) }}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Todos</option>
                          {authorOptions.map((a) => (
                            <option key={a.id} value={a.id}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {rootCategoryOptions.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-brand-text">Categoria</label>
                        <select
                          value={filterRootCategoryId}
                          onChange={(e) => { setFilterRootCategoryId(e.target.value); setPage(1) }}
                          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Todas</option>
                          {rootCategoryOptions.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { handleResetFilters(); setFilterMenuOpen(false) }}
                      className="mt-3 w-full text-xs text-destructive hover:text-destructive/80 transition text-left"
                    >
                      Limpar todos os filtros
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => { if (selectedIds.size > 0) setBulkDeleteModalOpen(true) }}
              disabled={bulkDeleting}
              title={
                selectedIds.size === 0
                  ? 'Selecione artigos para excluir'
                  : `Excluir ${selectedIds.size} selecionados`
              }
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition shrink-0 ${
                selectedIds.size === 0
                  ? 'border-border text-brand-muted opacity-40 cursor-not-allowed'
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
                placeholder="Pesquisar por artigo, categoria ou autor"
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
              <span className="text-sm text-brand-muted whitespace-nowrap px-0.5">
                Página {safePage} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1 text-brand-muted hover:text-brand-text disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border flex-wrap">
              {filterStatus !== 'ALL' && (
                <span className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  Status: {filterStatus === 'DRAFT' ? 'Rascunho' : 'Publicado'}
                  <button
                    onClick={() => { setFilterStatus('ALL'); setPage(1) }}
                    className="p-0.5 rounded-full hover:bg-brand-primary/20 transition"
                  >
                    <X size={9} />
                  </button>
                </span>
              )}
              {filterAuthorId && (
                <span className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  Autor: {authorOptions.find((a) => a.id === filterAuthorId)?.label}
                  <button
                    onClick={() => { setFilterAuthorId(''); setPage(1) }}
                    className="p-0.5 rounded-full hover:bg-brand-primary/20 transition"
                  >
                    <X size={9} />
                  </button>
                </span>
              )}
              {filterRootCategoryId && (
                <span className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  Categoria: {rootCategoryOptions.find((c) => c.id === filterRootCategoryId)?.name}
                  <button
                    onClick={() => { setFilterRootCategoryId(''); setPage(1) }}
                    className="p-0.5 rounded-full hover:bg-brand-primary/20 transition"
                  >
                    <X size={9} />
                  </button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-xs text-brand-muted hover:text-destructive transition ml-1"
              >
                Limpar todos
              </button>
            </div>
          )}

          <BlogPostsTable
            posts={paginated}
            basePath={basePath}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleAll={handleToggleAll}
            visibleColumns={visibleColumns}
            columnOrder={columnOrder}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>
      </div>

      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-brand-text mb-2">Excluir artigos selecionados</h3>
            <p className="text-sm text-brand-muted mb-5">
              Tem certeza que deseja excluir{' '}
              <span className="font-medium text-brand-text">{selectedIds.size}</span>{' '}
              artigo{selectedIds.size !== 1 ? 's' : ''}? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                ref={cancelBulkRef}
                onClick={() => setBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-brand-text hover:bg-brand-btn-light/40 transition focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                Cancelar
              </button>
              <button
                onClick={executeBulkDelete}
                disabled={bulkDeleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-destructive text-white hover:bg-destructive/90 disabled:opacity-60 transition gap-2 flex items-center"
              >
                {bulkDeleting && <Loader2 size={13} className="animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
