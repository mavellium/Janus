import {
  Home,
  FileText,
  Globe,
  Zap,
  Gauge,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface TourStep {
  kind: 'welcome' | 'spotlight' | 'seo-preview' | 'done'
  target?: string
  icon: LucideIcon
  title: string
  description: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    kind: 'welcome',
    icon: Home,
    title: 'Boas-vindas ao Janus',
    description:
      'Que bom ter você aqui! O Janus é a plataforma onde você acompanha seus sites, landing pages e resultados em um só lugar. Em menos de um minuto, mostramos o essencial para você aproveitar tudo desde o primeiro dia.',
  },
  {
    kind: 'spotlight',
    target: 'nav-home',
    icon: Home,
    title: 'Página Inicial',
    description:
      'Sua central de comando: visão geral dos projetos, atividade recente da equipe e atalhos para as ações mais importantes.',
  },
  {
    kind: 'spotlight',
    target: 'nav-results',
    icon: FileText,
    title: 'Resultados',
    description:
      'Acompanhe as métricas dos seus projetos: visitas, desempenho e evolução ao longo do tempo, tudo consolidado.',
  },
  {
    kind: 'spotlight',
    target: 'nav-sites',
    icon: Globe,
    title: 'Sites',
    description:
      'Aqui ficam os sites da sua empresa. Acesse páginas, blog e configurações de cada um deles.',
  },
  {
    kind: 'spotlight',
    target: 'nav-landing-pages',
    icon: Zap,
    title: 'Landing Pages',
    description:
      'Páginas de campanha focadas em conversão. Ideais para lançamentos, promoções e captação de leads.',
  },
  {
    kind: 'spotlight',
    target: 'nav-seo',
    icon: Gauge,
    title: 'Análise SEO/GEO',
    description:
      'Analise qualquer site e receba a pontuação de SEO e de visibilidade em IAs generativas (GEO) — você vai experimentar isso daqui a pouco.',
  },
  {
    kind: 'spotlight',
    target: 'nav-notifications',
    icon: Bell,
    title: 'Notificações',
    description:
      'Novidades da plataforma e notas de cada versão. Quando houver algo novo, um indicador aparece no sino.',
  },
  {
    kind: 'spotlight',
    target: 'nav-settings',
    icon: Settings,
    title: 'Configurações',
    description:
      'Atualize seu perfil, foto, senha e preferências como o tema escuro. É aqui também que você pode refazer este tour.',
  },
  {
    kind: 'seo-preview',
    icon: Gauge,
    title: 'Veja o Janus em ação',
    description:
      'Cole o link do seu site e receba na hora a pontuação de SEO e de prontidão para IAs generativas.',
  },
  {
    kind: 'done',
    icon: Home,
    title: 'Tudo pronto!',
    description:
      'Você concluiu o tour e já conhece o essencial do Janus. Bom trabalho — agora é só explorar.',
  },
]
