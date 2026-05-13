'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react'
import { deleteBlogTag } from '@/modules/blog/actions/deleteBlogTag'
import { TagModal } from '@/components/blog/TagModal'

interface BlogTag {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  slug: string
}

interface TagsClientProps {
  tags: BlogTag[]
  projectId: string
}

function DeleteTagButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()
  const [confirm, setConfirm] = useState(false)

  function handleDelete() {
    if (!confirm) { setConfirm(true); return }
    startTransition(async () => { await deleteBlogTag(id) })
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

export function TagsClient({ tags, projectId }: TagsClientProps) {
  const [modal, setModal] = useState<null | 'create' | BlogTag>(null)

  return (
    <div className="p-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-text">Tags</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {tags.length} tag{tags.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-cta text-white text-sm font-medium hover:bg-brand-cta-hover transition"
        >
          <Plus size={16} />
          Nova Tag
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag size={40} className="text-brand-muted opacity-40" />
            <p className="text-sm text-brand-muted">Nenhuma tag criada</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Tag</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Descrição</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-brand-btn-light/20 transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-btn-light overflow-hidden flex-shrink-0">
                        {tag.imageUrl ? (
                          <Image src={tag.imageUrl} alt={tag.name} width={32} height={32} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag size={14} className="text-brand-muted" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-brand-text">{tag.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">{tag.slug}</code>
                  </td>
                  <td className="px-5 py-3 text-sm text-brand-muted">{tag.description ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(tag)}
                        className="p-1.5 rounded text-brand-muted hover:text-brand-primary hover:bg-brand-btn-light transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <DeleteTagButton id={tag.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modal === 'create' && (
        <TagModal projectId={projectId} open onClose={() => setModal(null)} />
      )}
      {modal && modal !== 'create' && (
        <TagModal projectId={projectId} tag={modal} open onClose={() => setModal(null)} />
      )}
    </div>
  )
}
