import Image from 'next/image'
import Link from 'next/link'

const COLUMNS = [
  {
    title: 'O que faz',
    links: [
      { href: '#cms', label: 'Editar o conteúdo' },
      { href: '#seo', label: 'Análise de SEO' },
      { href: '#ia', label: 'Visibilidade em IA' },
      { href: '#operacao', label: 'Recursos do painel' },
    ],
  },
  {
    title: 'Saber mais',
    links: [
      { href: '#fluxo', label: 'Como funciona' },
      { href: '#precos', label: 'Planos' },
      { href: '#perguntas', label: 'Perguntas frequentes' },
      { href: '#api', label: 'Para desenvolvedores' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-brand-btn-light">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Image
              src="/janus-logo.svg"
              alt="Janus"
              width={127}
              height={56}
              className="h-8 w-auto dark:hidden"
            />
            <Image
              src="/janus-logo-white.svg"
              alt=""
              aria-hidden
              width={127}
              height={56}
              className="hidden h-8 w-auto dark:block"
            />
            <p className="mt-4 text-sm leading-relaxed text-brand-muted">
              O painel para editar o conteúdo do seu site, publicar na hora e acompanhar os
              resultados.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:flex sm:gap-16">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="lp-mono mb-4 text-[10px] uppercase tracking-[0.18em] text-brand-muted">
                  {column.title}
                </p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-sm text-brand-muted transition-colors hover:text-brand-text"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-brand-btn-light pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="lp-mono text-xs text-brand-muted">
            © {new Date().getFullYear()} Janus
          </p>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-text transition-colors hover:text-brand-cta"
          >
            Acessar o painel
          </Link>
        </div>
      </div>
    </footer>
  )
}
