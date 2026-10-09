import wizardScores from '@/data/wizard-scores.json';
import { liveModels, Model, blendedPrice, displayName } from '@/lib/data';

export type WizardAnswers = {
  task: 'coding' | 'writing' | 'research' | 'cheap-volume' | 'chat' | 'other';
  budget: 'low' | 'medium' | 'high';
  longContext: boolean;
  agentic: boolean;
};

type Scores = {
  coding: number;
  writing: number;
  research: number;
  agentic: number;
  longContext: number;
  cheapVolume: number;
};

const SCORES = wizardScores as Record<string, { scores: Scores; curated: boolean }>;

/**
 * Maps a questionnaire answer onto a score key. "chat" leans on writing because
 * conversational quality tracks prose quality more closely than anything else we
 * score; "other" leans on research as the most general-purpose axis.
 */
const TASK_KEY: Record<WizardAnswers['task'], keyof Scores> = {
  coding: 'coding',
  writing: 'writing',
  research: 'research',
  'cheap-volume': 'cheapVolume',
  chat: 'writing',
  other: 'research',
};

export function recommend(answers: WizardAnswers) {
  // Only live models. Recommending something that has been delisted is worse than
  // recommending nothing, and the directory deliberately still lists legacy models.
  let candidates: Model[] = liveModels.filter((m) => SCORES[m.id]);

  if (answers.longContext) {
    candidates = candidates.filter((m) => m.specs.contextWindow >= 200_000);
  }

  const taskKey = TASK_KEY[answers.task] ?? 'research';

  const scored = candidates.map((model) => {
    const scores = SCORES[model.id].scores;
    const price = blendedPrice(model);

    let weighted = 0;
    let totalWeight = 0;

    const add = (score: number, weight: number) => {
      weighted += score * weight;
      totalWeight += weight;
    };

    add(scores[taskKey], 2.0);
    if (answers.agentic) add(scores.agentic, 1.5);
    if (answers.longContext) add(scores.longContext, 1.0);

    // Budget shapes how much cheapness counts, and applies a soft penalty rather
    // than a hard filter, so a slightly-over-budget but far better model can still
    // surface.
    if (answers.budget === 'low') {
      add(scores.cheapVolume, 2.0);
      if (price > 1.0) weighted -= Math.min((price - 1.0) * 0.8, 6);
    } else if (answers.budget === 'medium') {
      add(scores.cheapVolume, 0.75);
      if (price > 6.0) weighted -= Math.min((price - 6.0) * 0.3, 4);
    } else {
      // Quality first. Nudge away from the very cheapest models, which are cheap
      // because they are small, but never let that dominate the task score.
      if (price < 0.5) weighted -= 1.0;
    }

    const matchScore = Math.max(0, Math.min(10, weighted / (totalWeight || 1)));
    return { model, matchScore: Number(matchScore.toFixed(1)), price };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore || a.price - b.price);

  const top3 = scored.slice(0, 3).map((item, index) => {
    const { model, matchScore, price } = item;
    const scores = SCORES[model.id].scores;

    // Name the reason it actually won, rather than restating the score.
    const drivers: string[] = [];
    if (scores[taskKey] >= 8) drivers.push(`it is one of the strongest here for ${answers.task.replace('-', ' ')}`);
    if (answers.agentic && scores.agentic >= 8) drivers.push('it holds a plan together across many steps');
    if (answers.longContext && scores.longContext >= 8) drivers.push('it handles very large inputs well');
    if (answers.budget === 'low' && scores.cheapVolume >= 8) drivers.push('it is cheap enough to run at volume');
    if (drivers.length === 0) drivers.push('it is the best balance of capability and price for these answers');

    return {
      modelId: model.id,
      rank: index + 1,
      matchScore,
      reason: `${displayName(model.name)} scores ${matchScore}/10 for what you described because ${drivers.join(', and ')}. ${model.summary}`,
      tradeoff: model.inPractice.weaknesses[0] ?? 'Every model has trade-offs; test it on your own work.',
      benchmarkNote: model.benchmarks.length === 0 ? model.benchmarkCaveat : null,
      modelData: {
        name: displayName(model.name),
        provider: model.provider,
        summary: model.summary,
        pricing: model.specs.pricing,
        blendedPrice: Number(price.toFixed(3)),
        contextWindow: model.specs.contextWindow,
        openSource: model.openSource,
      },
    };
  });

  if (top3.length === 0) {
    return {
      recommendations: [],
      message:
        answers.longContext
          ? 'No model here has a context window that large. Try answering "medium" to the length question.'
          : 'No models matched those answers. Try loosening one of them.',
    };
  }

  return { recommendations: top3, message: null };
}
