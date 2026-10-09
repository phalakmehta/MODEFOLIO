import { NextResponse } from 'next/server';
import { recommend, WizardAnswers } from '@/lib/wizard/recommend';
import { liveModels, getModelById, displayName } from '@/lib/data';

// Compress models so we don't blow up the Gemini context window/latency.
// Only live models: recommending something that has been delisted is worse than
// recommending nothing at all.
const getMinifiedModels = () => {
  return liveModels.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    pricing: m.specs.pricing,
    contextWindow: m.specs.contextWindow,
    weaknesses: m.inPractice?.weaknesses?.slice(0, 2) || [],
    strengths: m.inPractice?.strengths?.slice(0, 2) || [],
    tags: m.useCaseTags || [],
    openWeights: m.openSource,
    // Explicitly 'none published' rather than 'N/A', so the model cannot read an
    // absent score as a low one.
    mmlu: m.benchmarks.find((b) => b.name.toLowerCase().includes('mmlu'))?.score ?? 'none published'
  }));
};

const GEMINI_SYSTEM_PROMPT = `
You are an expert AI architect. Your job is to select the TOP 3 AI models from the provided JSON list that best fit the user's requirements.
We will give you the user's answers to a questionnaire and a list of available models.

Rules for recommendation:
- "low" budget means you MUST heavily prioritize cheap models (< $1/M tokens).
- "high" budget means you should pick the absolute best frontier models, ignoring cost.
- If "longContext" is true, the model MUST have at least 100,000 contextWindow.
- Think about the tradeoff between quality, speed, and cost.
- CRITICAL: You must remain 100% objective and vendor-neutral. Do NOT show any bias towards Google or Gemini models. Evaluate OpenAI, Anthropic, Meta, and all other providers fairly based purely on their specs, benchmarks, and suitability for the task.
- modelId MUST be copied exactly from the provided list. Never invent an id.
- Use ONLY the facts in the provided list. Do not cite benchmark scores, release
  dates or prices from your own memory, and never state a score for a model whose
  mmlu field says "none published".
- Write for someone with no technical background. Explain any jargon in the same sentence.

Return exactly this JSON schema:
{
  "recommendations": [
    {
      "modelId": "exact_id_from_list",
      "reason": "1-2 sentences explaining exactly why this model is perfect for the user's specific use case.",
      "tradeoff": "1 short sentence explaining a potential downside or tradeoff."
    }
  ]
}
Ensure exactly 3 models are returned, ranked best to worst.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const answers: WizardAnswers = body;

    const useLLM = process.env.WIZARD_LLM === '1';
    
    if (useLLM && process.env.GEMINI_API_KEY) {
      try {
        const payload = {
          userRequirements: answers,
          availableModels: getMinifiedModels()
        };
        
        const apiKey = process.env.GEMINI_API_KEY as string;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: JSON.stringify(payload) }] }],
            systemInstruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawText = data.candidates[0].content.parts[0].text;
          const parsed = JSON.parse(rawText);
          
          if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
            // Map back to get the full modelData
            type RawRec = { modelId?: string; reason?: string; tradeoff?: string };
            const finalRecs = parsed.recommendations.map((rec: RawRec, index: number) => {
              // Drop anything hallucinated or retired rather than rendering it.
              const fullModel = rec.modelId ? getModelById(rec.modelId) : undefined;
              if (!fullModel || fullModel.status !== 'live') return null;
              
              return {
                modelId: rec.modelId,
                rank: index + 1,
                matchScore: (100 - (index * 5)) / 10, // 10, 9.5, 9.0 for UI consistency
                reason: rec.reason,
                tradeoff: rec.tradeoff || fullModel.inPractice?.weaknesses?.[0] || "May have limitations.",
                benchmarkNote: fullModel.benchmarks.length === 0 ? fullModel.benchmarkCaveat : null,
                modelData: {
                  name: displayName(fullModel.name),
                  provider: fullModel.provider,
                  summary: fullModel.summary,
                  pricing: fullModel.specs.pricing,
                  contextWindow: fullModel.specs.contextWindow,
                  openSource: fullModel.openSource
                }
              };
            }).filter(Boolean);
            
            if (finalRecs.length === 3) {
              return NextResponse.json({ recommendations: finalRecs, message: null });
            }
            console.warn(
              `LLM returned ${finalRecs.length} usable recommendations of ${parsed.recommendations.length}; ` +
              `falling back to heuristics.`
            );
          }
        }
      } catch (e) {
        console.error("LLM Ranking failed, falling back to heuristics:", e);
      }
    }

    // 2. Fallback to math-based heuristics
    const result = recommend(answers);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Wizard API Error:', error);
    return NextResponse.json(
      { recommendations: [], message: 'An error occurred while generating recommendations.' },
      { status: 500 }
    );
  }
}
