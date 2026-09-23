import modelsData from '@/data/models.json';
import wizardScores from '@/data/wizard-scores.json';

// Note: Ensure types match the schema
export type WizardAnswers = {
  task: "coding" | "writing" | "research" | "cheap-volume" | "chat" | "other";
  budget: "low" | "medium" | "high";
  longContext: boolean;
  agentic: boolean;
};

export function recommend(answers: WizardAnswers) {
  let candidates = modelsData as any[];
  
  // 1. Soft Context Filter (loosened to 100k)
  if (answers.longContext) {
    candidates = candidates.filter(m => m.specs.contextWindow >= 100000);
  }

  // 2. Category weights scoring
  const scored = candidates.map(model => {
    const scores = (wizardScores as Record<string, any>)[model.id]?.scores || {
      coding: 5, writing: 5, research: 5, agentic: 5, longContext: 5, cheapVolume: 5
    };
    
    let totalWeight = 0;
    let weightedScore = 0;

    // Primary task logic
    let taskKey: string = answers.task;
    if (taskKey === "cheap-volume") taskKey = "cheapVolume";
    if (taskKey === "chat") taskKey = "writing"; 
    if (taskKey === "other") taskKey = "research"; 
    
    weightedScore += (scores[taskKey] || 5) * 1.5; 
    totalWeight += 1.5;

    // Agentic logic
    if (answers.agentic) {
      weightedScore += (scores.agentic || 5) * 1.2;
      totalWeight += 1.2;
    }

    // Long Context logic
    if (answers.longContext) {
      weightedScore += (scores.longContext || 5) * 0.8;
      totalWeight += 0.8;
    }

    // Blended price: 80% input, 20% output
    const blendedPrice = (model.specs.pricing.input * 0.8) + (model.specs.pricing.output * 0.2);

    // Budget weighting (Soft Penalties instead of hard deletes)
    if (answers.budget === "low") {
      weightedScore += (scores.cheapVolume || 5) * 1.5;
      totalWeight += 1.5;
      // Penalize expensive models
      if (blendedPrice > 1.5) {
        weightedScore -= (blendedPrice - 1.5) * 0.5; 
      }
    } else if (answers.budget === "medium") {
      weightedScore += (scores.cheapVolume || 5) * 0.5;
      totalWeight += 0.5;
      if (blendedPrice > 5.0) {
        weightedScore -= (blendedPrice - 5.0) * 0.2;
      }
    } else if (answers.budget === "high") {
      // Reward premium expensive models natively
      if (blendedPrice < 0.5) {
        weightedScore -= 0.5;
      }
      // Add benchmark boosts for high budget flagships
      const mmlu = model.benchmarks?.find((b: any) => b.name.toLowerCase().includes('mmlu'))?.score;
      if (mmlu && mmlu > 80) {
        weightedScore += (mmlu - 80) * 0.1; 
      }
    }

    if (weightedScore < 0) weightedScore = 0;
    if (totalWeight === 0) totalWeight = 1;
    let matchScore = Number((weightedScore / totalWeight).toFixed(1));
    if (matchScore > 10) matchScore = 10;

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
      reason: `With a heuristic score of ${matchScore}/10 for your criteria, ${model.name} is a solid match. ${model.summary}`,
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
      message: "No models matched your criteria perfectly. Try loosening your context requirements."
    };
  }

  return {
    recommendations: top3,
    message: null
  };
}
