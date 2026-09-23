import modelsData from '@/data/models.json';
import wizardScores from '@/data/wizard-scores.json';

// Note: Ensure types match the schema
export type WizardAnswers = {
  task: "coding" | "writing" | "research" | "cheap-volume" | "chat" | "other";
  budget: "low" | "medium" | "high";
  longContext: boolean;
  agentic: boolean;
};

// Hardcoded blended price cap for low budget ($1 per 1M tokens)
const LOW_BUDGET_CAP = 1.0;

export function recommend(answers: WizardAnswers) {
  let candidates = modelsData as any[];
  
  // 1. Hard filters
  if (answers.longContext) {
    candidates = candidates.filter(m => m.specs.contextWindow >= 200000);
  }
  
  if (answers.budget === "low") {
    candidates = candidates.filter(m => {
      const p = m.specs.pricing;
      // Blended price: 80% input, 20% output assumption
      const blended = (p.input * 0.8) + (p.output * 0.2);
      return blended <= LOW_BUDGET_CAP;
    });
  }

  // 2. Category weights scoring
  const scored = candidates.map(model => {
    const scores = (wizardScores as Record<string, any>)[model.id]?.scores || {
      coding: 5, writing: 5, research: 5, agentic: 5, longContext: 5, cheapVolume: 5
    };
    
    let totalWeight = 0;
    let weightedScore = 0;

    // Primary task
    if (answers.task !== "other" && answers.task !== "chat") {
      let taskKey = answers.task;
      if (taskKey === "cheap-volume") taskKey = "cheapVolume";
      weightedScore += (scores[taskKey] || 5) * 1.0;
      totalWeight += 1.0;
    }

    // Agentic
    if (answers.agentic) {
      weightedScore += (scores.agentic || 5) * 0.7;
      totalWeight += 0.7;
    }

    // Long Context
    if (answers.longContext) {
      weightedScore += (scores.longContext || 5) * 0.5;
      totalWeight += 0.5;
    }

    // Budget weighting
    if (answers.budget === "low") {
      weightedScore += (scores.cheapVolume || 5) * 0.9;
      totalWeight += 0.9;
    } else if (answers.budget === "medium") {
      weightedScore += (scores.cheapVolume || 5) * 0.4;
      totalWeight += 0.4;
    }

    if (totalWeight === 0) totalWeight = 1;
    const matchScore = Number((weightedScore / totalWeight).toFixed(1));

    // Blended price for tie-breaking
    const blendedPrice = (model.specs.pricing.input * 0.8) + (model.specs.pricing.output * 0.2);

    return { model, matchScore, blendedPrice };
  });

  // 3. Sort by matchScore desc; tie-break by lower blended price
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return a.blendedPrice - b.blendedPrice;
  });

  // 4. Return top 3
  const top3 = scored.slice(0, 3).map((item, index) => {
    const { model, matchScore } = item;
    
    let benchmarkNote = null;
    if ((answers.agentic || answers.task === "coding") && model.benchmarkCaveat) {
      benchmarkNote = model.benchmarkCaveat;
    }

    return {
      modelId: model.id,
      rank: index + 1,
      matchScore,
      reason: `With a score of ${matchScore}/10 for your needs, ${model.name} is a great choice. ${model.summary}`,
      tradeoff: model.inPractice?.weaknesses?.[0] || "May have specific limitations.",
      benchmarkNote,
      modelData: {
        name: model.name,
        provider: model.provider,
        summary: model.summary,
        pricing: model.specs.pricing
      }
    };
  });

  if (top3.length === 0) {
    return {
      recommendations: [],
      message: "No models matched your exact criteria. Try loosening your budget or context requirements."
    };
  }

  return {
    recommendations: top3,
    message: null
  };
}
