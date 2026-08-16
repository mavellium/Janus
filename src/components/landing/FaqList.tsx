import { Plus } from 'lucide-react'

const QUESTIONS = [
  {
    question: 'Preciso refazer o meu site?',
    answer:
      'Não. O Janus não substitui o seu site: ele cuida do conteúdo que aparece nele. O visual, o endereço e a tecnologia continuam os mesmos — muda só quem consegue editar o texto.',
  },
  {
    question: 'Dá para eu estragar o layout sem querer?',
    answer:
      'Não. Você não mexe no desenho da página, só nos campos liberados para ela: título, texto, foto, botão. O que não é editável nem aparece na tela.',
  },
  {
    question: 'Preciso chamar alguém para publicar?',
    answer:
      'Não. Você escreve, confere no preview ao lado e publica. O site atualiza em segundos. Para tirar uma página do ar, é o mesmo clique no sentido contrário.',
  },
  {
    question: 'Apaguei sem querer. E agora?',
    answer:
      'Toda alteração guarda o antes e o depois, com o nome de quem fez e a hora. Dá para ver o que mudou e restaurar o conteúdo anterior — inclusive uma página inteira que foi excluída.',
  },
  {
    question: 'Preciso entender de SEO para usar?',
    answer:
      'Não. O Janus dá uma nota de 0 a 100 e uma lista em português do que está atrapalhando, na ordem em que vale a pena resolver. Você decide o que arruma sozinho e o que passa para alguém.',
  },
  {
    question: 'Minha equipe inteira precisa de acesso total?',
    answer:
      'Não. Cada pessoa recebe acesso apenas às páginas e aos sites que interessam a ela. Quem só escreve no blog não enxerga o resto do painel.',
  },
]

export function FaqList() {
  return (
    <div className="divide-y divide-brand-btn-light border-y border-brand-btn-light">
      {QUESTIONS.map((item) => (
        <details key={item.question} className="lp-faq group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left sm:gap-6">
            <span className="lp-display text-[0.95rem] font-medium text-brand-text sm:text-base lg:text-lg">
              {item.question}
            </span>
            <Plus
              size={18}
              className="shrink-0 text-brand-muted transition-transform duration-300"
            />
          </summary>
          <p className="lp-faq-body max-w-2xl pb-6 text-sm leading-relaxed text-brand-muted sm:text-base">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}
