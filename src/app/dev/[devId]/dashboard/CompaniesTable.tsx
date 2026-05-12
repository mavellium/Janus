'use client'

import { useState } from 'react'
import { Plus, Building2, Users, Globe, ExternalLink } from 'lucide-react'
import { CreateCompanyModal } from './CreateCompanyModal'

interface Company {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  users: { id: string }[]
  projects: { id: string }[]
}

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-text">Empresas</h1>
          <p className="text-sm text-brand-muted mt-0.5">
            {companies.length} empresa{companies.length !== 1 ? 's' : ''} cadastrada{companies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-brand-primary text-white hover:bg-brand-hover transition"
        >
          <Plus className="w-4 h-4" />
          Nova Empresa
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Building2 className="w-10 h-10 text-brand-muted opacity-50" />
            <p className="text-sm text-brand-muted">Nenhuma empresa cadastrada</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-brand-primary hover:underline"
            >
              Criar a primeira empresa
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Empresa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Slug</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Usuários</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Projetos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide">Criada em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-brand-btn-light/30 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-brand-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-brand-text">{company.name}</p>
                        {company.description && (
                          <p className="text-xs text-brand-muted truncate max-w-[200px]">{company.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <code className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
                      {company.slug}
                    </code>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 text-sm text-brand-text">
                      <Users className="w-3.5 h-3.5 text-brand-muted" />
                      {company.users.length}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 text-sm text-brand-text">
                      <Globe className="w-3.5 h-3.5 text-brand-muted" />
                      {company.projects.length}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-brand-muted">
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`/${company.slug}/dashboard`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-brand-muted hover:text-brand-primary transition"
                      title="Abrir dashboard"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CreateCompanyModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
