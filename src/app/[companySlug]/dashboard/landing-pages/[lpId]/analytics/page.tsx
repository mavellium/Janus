export const metadata = { title: 'Resultados — Janus' }

export default async function LandingPageAnalyticsPage() {
  return (
    <div className="p-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-text">
          Resultados
        </h1>
      </div>

      <div className="bg-card rounded-xl border border-brand-btn-light p-8">
        <div className="flex items-center justify-center min-h-96">
          <p className="text-brand-muted">Análise de desempenho da landing page</p>
        </div>
      </div>
    </div>
  )
}
