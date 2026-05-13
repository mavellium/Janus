'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Search, Trash2, Loader2, Newspaper } from 'lucide-react'
import { deleteBlogPost } from '@/modules/blog/actions/deleteBlogPost'

interface Post {
  id: string
  title: string
  coverImageUrl: string | null
  publishedAt: Date
  authorName: string
  category: { id: string; name: string } | null
}

interface PostsListClientProps {
  posts: Post[]
  basePath: string
  projectId: string
}

function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    startTransition(async () => { await deleteBlogPost(postId) })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      title={confirm ? 'Confirmar exclusão' : 'Excluir'}
      className={`p-1.5 rounded transition ${confirm ? 'text-destructive bg-destructive/10' : 'text-brand-muted hover:text-destructive hover:bg-destructive/10'}`}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </button>
  )
}

export function PostsListClient({ posts, basePath, projectId }: PostsListClientProps) {
  const [search, setSearch] = useState('')

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.category?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.authorName.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Artigos do Blog</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {posts.length} artigo{posts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href={`${basePath}/blog/posts/new`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-cta text-white text-sm font-medium hover:bg-brand-cta-hover transition"
        >
          <Plus size={16} />
          Novo Artigo
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar por Artigo, Categoria, Autor..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-brand-bg border border-border rounded-lg text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
          </div>
          <span className="text-xs text-brand-muted ml-auto">
            Exibindo {filtered.length} de {posts.length} registros
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Newspaper size={40} className="text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">
              {search ? 'Nenhum artigo encontrado' : 'Nenhum artigo criado'}
            </p>
            {!search && (
              <Link
                href={`${basePath}/blog/posts/new`}
                className="text-sm text-brand-cta hover:underline"
              >
                Criar primeiro artigo
              </Link>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Detalhes</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Data de criação</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Autor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((post) => (
                <tr key={post.id} className="hover:bg-brand-btn-light/20 transition">
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
                      <span className="text-sm font-medium text-brand-text line-clamp-2 max-w-[220px]">
                        {post.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-muted">
                    {post.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-muted">
                    {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-muted">
                    {post.authorName}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <DeletePostButton postId={post.id} />
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
        )}
      </div>
    </div>
  )
}
