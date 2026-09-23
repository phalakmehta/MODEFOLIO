import { NextRequest, NextResponse } from 'next/server';
import { recommend, WizardAnswers } from '@/lib/wizard/recommend';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Basic validation
    if (!body || !body.task || !body.budget) {
      return NextResponse.json({ error: "Invalid request body. Missing task or budget." }, { status: 400 });
    }
    
    const answers: WizardAnswers = {
      task: body.task,
      budget: body.budget,
      longContext: Boolean(body.longContext),
      agentic: Boolean(body.agentic)
    };
    
    const result = recommend(answers);
    
    // Optional LLM Explanation Layer
    let explainedBy = "rules";
    let finalRecommendations = result.recommendations.map(r => ({
      modelId: r.modelId,
      rank: r.rank,
      matchScore: r.matchScore,
      reason: r.reason,
      tradeoff: r.tradeoff,
      benchmarkNote: r.benchmarkNote
    }));

    if (process.env.WIZARD_LLM === "1" && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const prompt = `Rewrite the reason field to be a friendly, personalized explanation based on these answers: Task=${answers.task}, Budget=${answers.budget}, Agentic=${answers.agentic}, LongContext=${answers.longContext}. Keep it short.
        Models: ${JSON.stringify(result.recommendations.map(r => ({ id: r.modelId, name: r.modelData.name, summary: r.modelData.summary })))}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            modelId: { type: "STRING" },
                            reason: { type: "STRING" }
                        }
                    }
                }
            }
        });
        
        const llmReasons = JSON.parse(response.text);
        
        finalRecommendations = finalRecommendations.map(r => {
            const llmMatch = llmReasons.find((l: any) => l.modelId === r.modelId);
            if (llmMatch && llmMatch.reason) {
                return { ...r, reason: llmMatch.reason };
            }
            return r;
        });
        
        explainedBy = "rules+llm";
      } catch (e) {
        console.error("LLM Explanation failed, falling back to rules:", e);
      }
    }
    
    return NextResponse.json({
      recommendations: finalRecommendations,
      explainedBy,
      message: result.message
    });
    
  } catch (error) {
    console.error("Wizard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
