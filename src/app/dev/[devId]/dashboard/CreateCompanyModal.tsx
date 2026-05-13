'use client'

import { useActionState, useState } from 'react'
import { createCompany } from '@/modules/dev/actions/createCompany'
import { X, Loader2, Building2 } from 'lucide-react'

export function CreateCompanyModal({ onClose }: { onClose: () => void }) {
  const [state, action, isPending] = useActionState(createCompany, { ok: false })

  if (state.ok) {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-primary" />
            <h2 className="text-base font-semibold text-brand-text">Nova Empresa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-btn-light transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Nome</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Acme Corp"
              className="bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Slug</label>
            <input
              name="slug"
              type="text"
              required
              placeholder="acme-corp"
              className="bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <p className="text-[11px] text-brand-muted">Apenas letras minúsculas, números e hífens</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-brand-muted">Descrição (opcional)</label>
            <input
              name="description"
              type="text"
              placeholder="Descrição da empresa"
              className="bg-brand-bg border border-border rounded-lg px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {state.error && (
            <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border text-brand-muted hover:bg-brand-btn-light transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-brand-primary text-white hover:bg-brand-hover transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isPending ? 'Criando...' : 'Criar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
