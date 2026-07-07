export function NotificationsSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 animate-pulse">
        <div className="h-9 w-full max-w-md rounded-lg bg-brand-btn-light/50" />
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-16 rounded-full bg-brand-btn-light/50" />
          <div className="h-7 w-20 rounded-full bg-brand-btn-light/40" />
          <div className="h-7 w-24 rounded-full bg-brand-btn-light/40" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="bg-card rounded-xl border border-brand-btn-light p-5 sm:p-6 animate-pulse"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-4 w-4 rounded bg-brand-btn-light/60" />
              <div className="h-5 w-24 rounded bg-brand-btn-light/60" />
              <div className="h-4 w-12 rounded-full bg-brand-btn-light/40" />
            </div>
            <div className="h-3 w-48 rounded bg-brand-btn-light/40 mb-4" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-brand-btn-light/40" />
              <div className="h-3 w-5/6 rounded bg-brand-btn-light/40" />
              <div className="h-3 w-2/3 rounded bg-brand-btn-light/40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
