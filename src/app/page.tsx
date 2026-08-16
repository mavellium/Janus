import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Building2,
  ChartColumn,
  CodeXml,
  Eye,
  FileImage,
  Globe,
  History,
  KeyRound,
  Newspaper,
  PencilLine,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { Reveal } from '@/components/landing/Reveal'
import { SectionHeading } from '@/components/landing/SectionHeading'
import { HeroPipeline } from '@/components/landing/HeroPipeline'
import { ScorePanel } from '@/components/landing/ScorePanel'
import { IagPanel } from '@/components/landing/IagPanel'
import { ApiTabs } from '@/components/landing/ApiTabs'
import { FaqList } from '@/components/landing/FaqList'

export const metadata: Metadata = {
  title: 'Janus — edite o seu site sem depender de ninguém',
  description:
    'Painel para trocar o texto e as fotos do seu site, publicar na hora, medir o SEO e descobrir se a sua marca aparece quando alguém pergunta para uma IA.',
  openGraph: {
    title: 'Janus — edite o seu site sem depender de ninguém',
    description:
      'Painel para trocar o texto e as fotos do seu site, publicar na hora, medir o SEO e descobrir se a sua marca aparece quando alguém pergunta para uma IA.',
    type: 'website',
  },
}

const FACTS = [
  { value: '14', label: 'pontos de SEO verificados em cada página' },
  { value: '3', label: 'inteligências artificiais consultadas sobre a marca' },
  { value: '20', label: 'páginas analisadas de uma vez' },
  { value: '60', label: 'dias de histórico de tudo que mudou' },
]

const PAINS = [
  'Trocar uma frase do site depende da agenda de outra pessoa.',
  'Ninguém sabe dizer se o site está aparecendo no Google — ou nas IAs.',
  'Uma página sumiu e não dá para saber quem mexeu, nem quando.',
  'Os números do site moram num painel que ninguém abre.',
]

const GAINS = [
  'Você edita o texto, salva, e o site muda na hora.',
  'Nota de SEO e visibilidade em IA na mesma tela do conteúdo.',
  'Todo ajuste fica registrado com autor e horário, e dá para voltar atrás.',
  'O site continua o mesmo. O Janus cuida do conteúdo e dos resultados.',
]

const CMS_CARDS = [
  {
    icon: PencilLine,
    title: 'Editar sem medo',
    span: true,
    text: 'Você recebe um formulário com os campos da sua página — título, texto, foto, botão — e nada além disso. Não existe onde clicar errado: o que não é editável simplesmente não aparece.',
    detail: null,
  },
  {
    icon: Eye,
    title: 'Ver antes',
    span: false,
    text: 'A página aparece ao lado enquanto você escreve, do jeito que vai ficar no computador, no tablet e no celular.',
    detail: null,
  },
  {
    icon: Globe,
    title: 'Publicar na hora',
    span: false,
    text: 'Um clique publica. Outro tira do ar. Sem pedir para ninguém, sem esperar atualização do site.',
    detail: null,
  },
  {
    icon: Braces,
    title: 'Feito para durar',
    span: true,
    text: 'O conteúdo fica separado do visual do site. Trocar o layout, o time ou a agência não obriga a digitar tudo de novo — o texto continua onde está.',
    detail: null,
  },
]

const OPERATIONS = [
  {
    icon: Building2,
    title: 'Vários sites, um painel',
    text: 'Cada site e cada landing page com seu próprio conteúdo e seus próprios números, sem misturar.',
  },
  {
    icon: KeyRound,
    title: 'Cada um no seu quadrado',
    text: 'Libere o time de marketing para escrever sem dar acesso ao resto. Quem não pode editar, não vê o botão.',
  },
  {
    icon: Eye,
    title: 'Suporte que enxerga',
    text: 'Quem te atende consegue abrir a mesma tela que você está vendo para resolver na hora — e fica registrado que olhou.',
  },
  {
    icon: History,
    title: 'Nada se perde',
    text: 'Toda alteração guarda o antes e o depois. Apagou sem querer? Dá para restaurar em dois cliques.',
  },
  {
    icon: Newspaper,
    title: 'Blog incluído',
    text: 'Editor de texto completo, categorias, marcadores e artigo programado para publicar sozinho na data certa.',
  },
  {
    icon: ChartColumn,
    title: 'Resultados sem planilha',
    text: 'Visitas, origem do tráfego, páginas mais vistas e quantos viraram contato — sem abrir o Google Analytics.',
  },
  {
    icon: CodeXml,
    title: 'Pixels e chats',
    text: 'Instale o pixel do Meta, o Google Ads ou o chat do WhatsApp direto no painel, sem chamar o desenvolvedor.',
  },
  {
    icon: FileImage,
    title: 'Imagens leves',
    text: 'Toda foto enviada é comprimida automaticamente. Site rápido sem ninguém precisar pensar nisso.',
  },
]

const FLOW = [
  {
    step: '01',
    title: 'A gente monta as páginas',
    text: 'Seu site é ligado ao painel e cada página ganha os campos que fazem sentido para ela.',
  },
  {
    step: '02',
    title: 'Você escreve',
    text: 'Entra no painel, troca o texto, sobe a foto, confere no preview e publica.',
  },
  {
    step: '03',
    title: 'O site atualiza sozinho',
    text: 'O conteúdo novo chega ao site em segundos. Nada de fila, nada de "vou pedir para o pessoal".',
  },
]

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    if (session.user.role === 'DEVELOPER') redirect(`/dev/${session.user.id}/dashboard`)
    if (session.user.role === 'ADMIN') redirect('/dashboard-admin')
    if (!session.user.companySlug) redirect('/no-company')
    redirect(`/${session.user.companySlug}/dashboard`)
  }

  return (
    <div className="lp-landing w-full overflow-x-clip bg-brand-bg">
      <LandingNav />

      <main>
        <section className="relative overflow-hidden pt-24 sm:pt-32 lg:pt-36">
          <div
            aria-hidden
            className="lp-dots lp-fade-b pointer-events-none absolute inset-x-0 top-0 h-[560px]"
          />
          <div
            aria-hidden
            className="lp-glow-cta lp-drift pointer-events-none absolute left-1/2 top-[-14%] h-[620px] w-[1000px] -translate-x-1/2"
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
              <div>
                <Reveal>
                  <span className="lp-mono inline-flex items-center gap-2 rounded-full border border-brand-btn-light px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-brand-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-cta" />
                    Conteúdo · SEO · Resultados
                  </span>
                </Reveal>

                <Reveal delay={90}>
                  <h1 className="lp-display mt-5 text-[2rem] font-semibold leading-[1.08] tracking-tight text-brand-text sm:mt-6 sm:text-5xl sm:leading-[1.05] lg:text-[3.5rem]">
                    Seu site muda
                    <br />
                    <span className="text-brand-primary">quando você decide.</span>
                  </h1>
                </Reveal>

                <Reveal delay={170}>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
                    Um lugar para trocar o texto do site, publicar na hora e ver se ele está
                    aparecendo no Google e nas IAs. Sem depender de ninguém, sem mexer em
                    código.
                  </p>
                </Reveal>

                <Reveal delay={250}>
                  <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center">
                    <Link
                      href="/login"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-cta px-6 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover sm:h-11"
                    >
                      Acessar o painel
                      <ArrowRight size={16} />
                    </Link>
                    <a
                      href="#cms"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-brand-btn-light px-6 text-sm font-medium text-brand-text transition-colors hover:bg-brand-btn-light sm:h-11"
                    >
                      Ver o painel por dentro
                    </a>
                  </div>
                </Reveal>

                <Reveal delay={330}>
                  <p className="mt-7 max-w-md text-sm leading-relaxed text-brand-muted">
                    Feito para quem escreve o texto, não para quem escreve o código.
                  </p>
                </Reveal>
              </div>

              <Reveal delay={200}>
                <HeroPipeline />
              </Reveal>
            </div>

            <Reveal delay={120} className="mt-14 sm:mt-16">
              <dl className="lp-tint-track grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand-btn-light lg:grid-cols-4">
                {FACTS.map((fact) => (
                  <div key={fact.label} className="bg-brand-bg px-4 py-5 sm:px-5 sm:py-6">
                    <dt className="lp-display text-2xl font-semibold tabular-nums text-brand-text sm:text-3xl">
                      {fact.value}
                    </dt>
                    <dd className="mt-1 text-sm leading-snug text-brand-muted">
                      {fact.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        <section className="py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                index="01"
                eyebrow="O de sempre"
                title="Trocar uma frase não devia levar três dias."
                description="O site fica pronto e começa a envelhecer: o preço mudou, a foto é antiga, a promoção acabou. E cada ajuste vira um pedido na fila de outra pessoa."
              />
            </Reveal>

            <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-2 lg:gap-16">
              <Reveal delay={80}>
                <p className="lp-mono mb-5 text-[10px] uppercase tracking-[0.18em] text-brand-muted">
                  Sem painel
                </p>
                <ul className="space-y-4">
                  {PAINS.map((pain) => (
                    <li
                      key={pain}
                      className="border-l-2 border-brand-btn-light pl-4 text-base leading-relaxed text-brand-muted"
                    >
                      {pain}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={160}>
                <p className="lp-mono mb-5 text-[10px] uppercase tracking-[0.18em] text-brand-cta">
                  Com o Janus
                </p>
                <ul className="space-y-4">
                  {GAINS.map((gain) => (
                    <li
                      key={gain}
                      className="lp-border-cta border-l-2 pl-4 text-base leading-relaxed text-brand-text"
                    >
                      {gain}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="cms" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                index="02"
                eyebrow="Conteúdo"
                title="Quem edita não precisa saber nada de código."
                description="Nada de arrastar blocos e torcer para o layout sobreviver. Você preenche campos com nome de gente — título, foto, botão — e o site se encarrega do resto."
              />
            </Reveal>

            <div className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
              {CMS_CARDS.map((card, position) => {
                const Icon = card.icon
                return (
                  <Reveal
                    key={card.title}
                    delay={position * 90}
                    className={card.span ? 'lg:col-span-2' : undefined}
                  >
                    <article className="lp-card flex h-full flex-col rounded-2xl border border-brand-btn-light bg-card p-6">
                      <span className="lp-tint-primary mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl">
                        <Icon size={18} className="text-brand-primary" />
                      </span>
                      <h3 className="lp-display text-lg font-semibold text-brand-text">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                        {card.text}
                      </p>
                      {card.detail && (
                        <p className="lp-mono lp-tint-surface mt-5 overflow-x-auto whitespace-nowrap rounded-lg px-3 py-2.5 text-[11px] text-brand-muted">
                          {card.detail}
                        </p>
                      )}
                    </article>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        <section id="seo" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
              <Reveal>
                <SectionHeading
                  index="03"
                  eyebrow="SEO"
                  title="Uma nota, e a lista do que arrumar."
                  description="Em vez de um relatório de 40 páginas que ninguém lê, o Janus dá uma nota de 0 a 100 e mostra, em ordem de urgência, o que está atrapalhando o site de aparecer nas buscas."
                />
                <ul className="mt-8 space-y-3">
                  {[
                    'Analisa o site inteiro, não só a página inicial.',
                    'O que está errado em várias páginas ao mesmo tempo aparece primeiro.',
                    'Verifica também se as IAs conseguem ler e entender o seu site.',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-brand-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cta" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={120}>
                <ScorePanel />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="ia" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 sm:gap-14 lg:grid-cols-2 lg:gap-20">
              <Reveal delay={120} className="order-2 lg:order-1">
                <IagPanel />
              </Reveal>

              <Reveal className="order-1 lg:order-2">
                <SectionHeading
                  index="04"
                  eyebrow="Visibilidade em IA"
                  title="Quando alguém pergunta pro ChatGPT, sua marca aparece?"
                  description="Cada vez mais gente escolhe empresa perguntando pra uma IA. O Janus faz essas perguntas por você, em três delas, e conta quantas vezes a sua marca é citada — e quem é citado no seu lugar."
                />
                <ul className="mt-8 space-y-3">
                  {[
                    'Quem está prestes a comprar pesa mais do que quem só está pesquisando.',
                    'A pergunta nunca cita a sua marca, senão a resposta viria viciada.',
                    'Histórico de cada rodada, para você ver se está subindo ou caindo.',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-relaxed text-brand-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-cta" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="operacao" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                index="05"
                eyebrow="No dia a dia"
                title="Tudo que o site pede, no mesmo lugar."
                description="Blog, pixel de anúncio, número de visitas, acesso do estagiário. As coisas que hoje estão espalhadas em cinco ferramentas e três senhas."
              />
            </Reveal>

            <div className="mt-10 grid gap-x-6 gap-y-px sm:mt-14 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4">
              {OPERATIONS.map((item, position) => {
                const Icon = item.icon
                return (
                  <Reveal key={item.title} delay={(position % 4) * 80}>
                    <div className="border-t border-brand-btn-light py-6">
                      <Icon size={18} className="mb-4 text-brand-cta" />
                      <h3 className="lp-display text-base font-medium text-brand-text">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                        {item.text}
                      </p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        <section id="fluxo" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading
                index="06"
                eyebrow="Como funciona"
                title="Do texto novo ao site no ar, em minutos."
              />
            </Reveal>

            <ol className="mt-10 grid gap-8 sm:mt-14 sm:gap-10 md:grid-cols-3 md:gap-8">
              {FLOW.map((item, position) => (
                <li key={item.step}>
                  <Reveal delay={position * 110}>
                    <div className="mb-5 flex items-center gap-4">
                      <span className="lp-mono lp-border-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs text-brand-primary">
                        {item.step}
                      </span>
                      <span className="h-px flex-1 bg-brand-btn-light" />
                    </div>
                    <h3 className="lp-display text-lg font-semibold text-brand-text">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                      {item.text}
                    </p>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="api" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-10 sm:gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <Reveal>
                <SectionHeading
                  index="07"
                  eyebrow="Para quem desenvolve"
                  title="O conteúdo sai numa URL, e pronto."
                  description="Se você tem um time de tecnologia ou uma agência cuidando do site, esta parte é para eles: nada para instalar, nada para migrar, e o site continua sendo feito com a tecnologia que já usa."
                />
                <p className="mt-8 text-sm leading-relaxed text-brand-muted">
                  Dá para pedir a página inteira, a lista de seções ou apenas uma delas. É
                  exatamente o que acabou de ser salvo no painel.
                </p>
              </Reveal>

              <Reveal delay={120}>
                <ApiTabs />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="perguntas" className="scroll-mt-16 py-16 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <SectionHeading index="08" eyebrow="Perguntas" title="O que costumam perguntar." />
            </Reveal>
            <Reveal delay={100} className="mt-8 sm:mt-12">
              <FaqList />
            </Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden py-20 sm:py-24 lg:py-32">
          <div
            aria-hidden
            className="lp-glow-primary lp-drift pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[880px] -translate-x-1/2 -translate-y-1/2"
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <Reveal>
              <h2 className="lp-display text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-brand-text sm:text-4xl sm:leading-[1.12] lg:text-5xl">
                O site é seu. O controle também.
              </h2>
            </Reveal>
            <Reveal delay={90}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
                Conteúdo, SEO e resultados na mesma tela — e cada alteração com nome e hora.
              </p>
            </Reveal>
            <Reveal delay={170}>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-cta px-6 text-sm font-medium text-white transition-colors hover:bg-brand-cta-hover"
                >
                  Acessar o painel
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#cms"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-btn-light px-6 text-sm font-medium text-brand-text transition-colors hover:bg-brand-btn-light"
                >
                  Ver como funciona
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
