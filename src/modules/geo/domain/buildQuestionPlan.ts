import type { GeoQuestionLayer } from '@/generated/prisma/client'

/** Distribui `count` perguntas entre as 3 camadas o mais equilibrado possível. */
export function buildQuestionPlan(count: number): GeoQuestionLayer[] {
  const layers: GeoQuestionLayer[] = ['DECISAO', 'AVALIACAO', 'PROBLEMA']
  const plan: GeoQuestionLayer[] = []
  for (let i = 0; i < count; i++) {
    plan.push(layers[i % layers.length])
  }
  return plan
}
