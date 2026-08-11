import {
  LAYER_WEIGHTS,
  type IagScoreInput,
  type IagScoreQuestionBreakdown,
  type IagScoreResult,
} from './geoProbe'

export const MAX_IAG_SCORE = 100

export function calculateIagScore(runs: IagScoreInput[]): IagScoreResult {
  const counted = runs.filter((run) => !run.errored)

  const grouped = new Map<string, IagScoreInput[]>()
  for (const run of counted) {
    const bucket = grouped.get(run.questionId)
    if (bucket) bucket.push(run)
    else grouped.set(run.questionId, [run])
  }

  const byQuestion: IagScoreQuestionBreakdown[] = []
  let weightedSum = 0
  let totalWeight = 0

  for (const [questionId, questionRuns] of grouped) {
    const layer = questionRuns[0].layer
    const weight = LAYER_WEIGHTS[layer]
    const probesMentioned = questionRuns.filter((run) => run.companyMentioned).length
    const mentionRate = probesMentioned / questionRuns.length

    weightedSum += mentionRate * weight
    totalWeight += weight

    byQuestion.push({
      questionId,
      layer,
      weight,
      probesCounted: questionRuns.length,
      probesMentioned,
      mentionRate,
    })
  }

  const score = totalWeight === 0 ? 0 : Math.round((weightedSum / totalWeight) * MAX_IAG_SCORE)

  const competitorMentions = new Map<string, number>()
  for (const run of counted) {
    if (!run.mentionedCompetitorId) continue
    competitorMentions.set(
      run.mentionedCompetitorId,
      (competitorMentions.get(run.mentionedCompetitorId) ?? 0) + 1,
    )
  }

  const mentionedProbes = counted.filter((run) => run.companyMentioned).length
  const voiceTotal = mentionedProbes + [...competitorMentions.values()].reduce((a, b) => a + b, 0)

  const competitorComparison = [...competitorMentions.entries()]
    .map(([competitorId, mentions]) => ({
      competitorId,
      mentions,
      shareOfVoice: voiceTotal === 0 ? 0 : Math.round((mentions / voiceTotal) * 100),
    }))
    .sort((a, b) => b.mentions - a.mentions)

  return {
    score,
    totalProbes: runs.length,
    countedProbes: counted.length,
    erroredProbes: runs.length - counted.length,
    mentionedProbes,
    byQuestion: byQuestion.sort((a, b) => b.weight - a.weight || a.mentionRate - b.mentionRate),
    competitorComparison,
  }
}
