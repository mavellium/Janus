export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-y-auto flex items-center justify-center bg-brand-bg">
      {children}
    </div>
  )
}
