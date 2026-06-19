'use client'

import { useEffect, useState } from 'react'
import { Eye, Users, Activity, AlertTriangle, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from './KpiCard'
import { AnalyticsAreaChart } from './AnalyticsAreaChart'
import { Ga4SetupForm } from './Ga4SetupForm'
import { FunnelCard } from './FunnelCard'
import { EventConversionsCard } from './EventConversionsCard'
import { ChannelConversionTable } from './ChannelConversionTable'
import { TrafficSourceTable } from './TrafficSourceTable'
import { TopPagesTable } from './TopPagesTable'
import type { FullAnalyticsReport } from '@/lib/analytics/ga4-client'

interface Props {
  companySlug: string
  propertyId: string | null
  projectId: string
  userRole?: string
}

export function AnalyticsPanel({ companySlug, propertyId: initialPropertyId, projectId, userRole }: Props) {
  const [isEditing, setIsEditing] = useState(!initialPropertyId)
  const [propertyId] = useState(initialPropertyId)
  const [data, setData] = useState<FullAnalyticsReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!propertyId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?propertyId=${propertyId}`)
        const json = await res.json()
        setData(json.ok ? json.data : null)
      } catch {
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [propertyId])

  const handleFormSubmit = () => {
    setIsEditing(false)
  }

  if (isEditing || !propertyId) {
    return (
      <div className="bg-card rounded-xl border border-brand-btn-light">
        <Ga4SetupForm companySlug={companySlug} projectId={projectId} onSuccess={handleFormSubmit} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(userRole === 'ADMIN' || userRole === 'DEVELOPER') && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-muted">
              Property ID: <code className="text-xs bg-brand-btn-light px-2 py-1 rounded">{propertyId}</code>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
            <Edit2 className="h-4 w-4" />
            Alterar
          </Button>
        </div>
      )}

      {loading ? (
        <div className="h-72 rounded-xl border border-brand-btn-light bg-card flex items-center justify-center">
          <p className="text-sm text-brand-muted">Carregando dados...</p>
        </div>
      ) : !data ? (
        <div className="bg-card rounded-xl border border-brand-btn-light p-8">
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <p className="text-sm text-brand-muted max-w-sm">
              Não foi possível carregar os dados do Google Analytics. Verifique se:
            </p>
            <ul className="text-xs text-brand-muted space-y-1">
              <li>• A API <code className="bg-brand-btn-light px-1">analyticsdata.googleapis.com</code> está habilitada no GCP</li>
              <li>• A Service Account tem acesso (Viewer) à propriedade GA4</li>
              <li>• O Property ID está correto</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          <FunnelCard funnel={data.funnel} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <KpiCard label="Total de Visitas" value={data.metrics.totals.views} icon={Eye} />
            <KpiCard label="Usuários Únicos" value={data.metrics.totals.visitors} icon={Users} />
            <KpiCard label="Sessões" value={data.metrics.totals.sessions} icon={Activity} />
          </div>

          <EventConversionsCard events={data.events} />

          <div className="bg-card rounded-xl border border-brand-btn-light p-4 sm:p-6">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-brand-text">
                Como o volume de acessos evoluiu?
              </h3>
              <p className="text-sm text-brand-muted">Pageviews e visitantes únicos — últimos 30 dias</p>
            </div>
            {data.metrics.series.length > 0 ? (
              <AnalyticsAreaChart data={data.metrics.series} />
            ) : (
              <div className="flex items-center justify-center h-72">
                <p className="text-sm text-brand-muted">Sem dados no período selecionado</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChannelConversionTable channels={data.channels} />
            <TrafficSourceTable sources={data.sources} />
          </div>

          <TopPagesTable pages={data.pages} />
        </>
      )}
    </div>
  )
}
