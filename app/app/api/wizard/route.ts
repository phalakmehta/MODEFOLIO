import { NextResponse } from 'next/server';
import { recommend, WizardAnswers } from '@/lib/wizard/recommend';
import modelsData from '@/data/models.json';

// Compress models so we don't blow up the Gemini context window/latency
const getMinifiedModels = () => {
  return modelsData.map((m: any) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    pricing: m.specs.pricing,
    contextWindow: m.specs.contextWindow,
    weaknesses: m.inPractice?.weaknesses?.slice(0, 2) || [],
    strengths: m.inPractice?.strengths?.slice(0, 2) || [],
    tags: m.useCaseTags || [],
    mmlu: m.benchmarks?.find((b: any) => b.name.toLowerCase().includes('mmlu'))?.score || 'N/A'
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
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
            const finalRecs = parsed.recommendations.map((rec: any, index: number) => {
              const fullModel = modelsData.find((m: any) => m.id === rec.modelId);
              if (!fullModel) return null;
              
              let benchmarkNote = null;
              if ((answers.agentic || answers.task === "coding") && fullModel.benchmarkCaveat) {
                benchmarkNote = fullModel.benchmarkCaveat;
              }

              return {
                modelId: rec.modelId,
                rank: index + 1,
                matchScore: (100 - (index * 5)) / 10, // Generates 10, 9.5, 9.0 for UI visual consistency
                reason: rec.reason,
                tradeoff: rec.tradeoff || fullModel.inPractice?.weaknesses?.[0] || "May have limitations.",
                benchmarkNote,
                modelData: {
                  name: fullModel.name,
                  provider: fullModel.provider,
                  summary: fullModel.summary,
                  pricing: fullModel.specs.pricing
                }
              };
            }).filter(Boolean);
            
            if (finalRecs.length > 0) {
              return NextResponse.json({ recommendations: finalRecs, message: null });
            }
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
