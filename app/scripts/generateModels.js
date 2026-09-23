const fs = require('fs');
const path = require('path');

const providers = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
  meta: 'Meta',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  qwen: 'Alibaba',
  cohere: 'Cohere',
  xai: 'xAI'
};

const baseModels = [
  // Anthropic
  { id: 'claude-opus-5', name: 'Claude Opus 5', p: 'anthropic', type: 'dense', in: 20, out: 100, ctx: 400000, mmlu: 93.1, he: 97.2, tags: ['coding', 'agentic', 'complex reasoning'] },
  { id: 'claude-sonnet-5', name: 'Claude Sonnet 5', p: 'anthropic', type: 'dense', in: 4, out: 20, ctx: 400000, mmlu: 91.8, he: 95.6, tags: ['coding', 'writing', 'value'] },
  { id: 'claude-fable', name: 'Fable', p: 'anthropic', type: 'dense', in: 0.25, out: 1.25, ctx: 200000, mmlu: 87.3, he: 89.5, tags: ['fast', 'cheap', 'chatbot'] },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', p: 'anthropic', type: 'dense', in: 3, out: 15, ctx: 200000, mmlu: 88.7, he: 92.0, tags: ['coding', 'writing'] },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', p: 'anthropic', type: 'dense', in: 15, out: 75, ctx: 200000, mmlu: 86.8, he: 84.9, tags: ['legacy', 'writing'] },
  
  // Google
  { id: 'gemini-muse', name: 'Gemini Muse', p: 'google', type: 'moe', in: 3, out: 12, ctx: 2000000, mmlu: 92.4, he: 91.3, tags: ['multimodal', 'creative', 'general'] },
  { id: 'gemini-glimmer', name: 'Gemini Glimmer', p: 'google', type: 'moe', in: 0.03, out: 0.10, ctx: 524288, mmlu: 82.1, he: 81.5, tags: ['fast', 'cheap', 'high-volume'] },
  { id: 'gemini-flash-v4', name: 'Gemini Flash V4', p: 'google', type: 'moe', in: 0.10, out: 0.40, ctx: 2000000, mmlu: 91.7, he: 92.1, tags: ['fast', 'value', 'multimodal'] },
  { id: 'gemini-deep-think', name: 'Gemini Deep Think', p: 'google', type: 'moe', in: 2.50, out: 15.00, ctx: 2000000, mmlu: 94.2, he: 94.8, tags: ['research', 'math', 'complex reasoning'] },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', p: 'google', type: 'moe', in: 1.25, out: 5.00, ctx: 2000000, mmlu: 85.9, he: 84.1, tags: ['legacy', 'long documents'] },
  
  // OpenAI
  { id: 'gpt-5', name: 'GPT-5', p: 'openai', type: 'moe', in: 3.0, out: 15.0, ctx: 1000000, mmlu: 93.5, he: 95.1, tags: ['general', 'coding', 'research'] },
  { id: 'gpt-5-mini', name: 'GPT-5 mini', p: 'openai', type: 'moe', in: 0.20, out: 0.80, ctx: 256000, mmlu: 88.2, he: 90.3, tags: ['cheap', 'fast', 'general'] },
  { id: 'o3', name: 'o3', p: 'openai', type: 'moe', in: 5.0, out: 20.0, ctx: 200000, mmlu: 95.1, he: 96.0, tags: ['complex reasoning', 'math', 'coding'] },
  { id: 'o1-preview', name: 'o1-preview', p: 'openai', type: 'moe', in: 15.0, out: 60.0, ctx: 128000, mmlu: 90.8, he: 92.4, tags: ['complex reasoning', 'legacy'] },
  { id: 'gpt-4o', name: 'GPT-4o', p: 'openai', type: 'dense', in: 2.50, out: 10.00, ctx: 128000, mmlu: 88.7, he: 90.2, tags: ['general', 'multimodal', 'fast'] },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', p: 'openai', type: 'dense', in: 0.15, out: 0.60, ctx: 128000, mmlu: 82.0, he: 87.2, tags: ['cheap', 'fast'] },

  // Meta (Open Source)
  { id: 'llama-5-400b', name: 'Llama 5 400B', p: 'meta', type: 'moe', in: 0.40, out: 1.60, ctx: 524288, mmlu: 92.1, he: 93.5, tags: ['open-source', 'general', 'coding'], os: true },
  { id: 'llama-5-70b', name: 'Llama 5 70B', p: 'meta', type: 'dense', in: 0.15, out: 0.60, ctx: 524288, mmlu: 88.5, he: 90.1, tags: ['open-source', 'value'], os: true },
  { id: 'llama-5-8b', name: 'Llama 5 8B', p: 'meta', type: 'dense', in: 0.05, out: 0.15, ctx: 256000, mmlu: 79.2, he: 78.5, tags: ['open-source', 'fast', 'cheap'], os: true },
  { id: 'llama-3-1-405b', name: 'Llama 3.1 405B', p: 'meta', type: 'dense', in: 0.70, out: 2.00, ctx: 128000, mmlu: 88.6, he: 89.0, tags: ['open-source', 'legacy'], os: true },
  { id: 'llama-3-2-3b', name: 'Llama 3.2 3B', p: 'meta', type: 'dense', in: 0.02, out: 0.08, ctx: 128000, mmlu: 63.4, he: 60.1, tags: ['open-source', 'edge', 'cheap'], os: true },

  // DeepSeek
  { id: 'deepseek-flash-4', name: 'DeepSeek Flash 4', p: 'deepseek', type: 'moe', in: 0.10, out: 0.40, ctx: 256000, mmlu: 89.8, he: 97.5, tags: ['open-source', 'coding', 'cheap'], os: true },
  { id: 'deepseek-r2', name: 'DeepSeek R2', p: 'deepseek', type: 'moe', in: 0.40, out: 1.60, ctx: 256000, mmlu: 93.1, he: 92.1, tags: ['open-source', 'complex reasoning', 'math'], os: true },
  { id: 'deepseek-v3', name: 'DeepSeek V3', p: 'deepseek', type: 'moe', in: 0.14, out: 0.28, ctx: 128000, mmlu: 87.1, he: 88.2, tags: ['open-source', 'general'], os: true },
  { id: 'deepseek-r1', name: 'DeepSeek R1', p: 'deepseek', type: 'moe', in: 0.55, out: 2.19, ctx: 128000, mmlu: 90.8, he: 91.5, tags: ['open-source', 'complex reasoning', 'legacy'], os: true },
  { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', p: 'deepseek', type: 'moe', in: 0.14, out: 0.28, ctx: 128000, mmlu: 79.2, he: 90.2, tags: ['open-source', 'coding', 'legacy'], os: true },

  // Mistral
  { id: 'mistral-frontier', name: 'Mistral Frontier', p: 'mistral', type: 'moe', in: 2.50, out: 10.00, ctx: 256000, mmlu: 91.5, he: 92.8, tags: ['multilingual', 'general', 'coding'] },
  { id: 'mistral-large-2', name: 'Mistral Large 2', p: 'mistral', type: 'dense', in: 2.00, out: 6.00, ctx: 128000, mmlu: 84.0, he: 86.1, tags: ['multilingual', 'legacy'] },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B', p: 'mistral', type: 'moe', in: 0.60, out: 1.80, ctx: 65536, mmlu: 77.3, he: 75.1, tags: ['open-source', 'legacy'], os: true },
  { id: 'mistral-nemo', name: 'Mistral Nemo (12B)', p: 'mistral', type: 'dense', in: 0.10, out: 0.30, ctx: 128000, mmlu: 68.1, he: 65.2, tags: ['open-source', 'edge'], os: true },

  // Qwen
  { id: 'qwen-4', name: 'Qwen 4', p: 'qwen', type: 'dense', in: 0.50, out: 2.00, ctx: 262144, mmlu: 91.2, he: 94.1, tags: ['open-source', 'multilingual', 'coding'], os: true },
  { id: 'qwen-2-5-72b', name: 'Qwen 2.5 72B', p: 'qwen', type: 'dense', in: 0.30, out: 0.80, ctx: 128000, mmlu: 85.3, he: 86.8, tags: ['open-source', 'multilingual'], os: true },
  { id: 'qwen-2-5-coder', name: 'Qwen 2.5 Coder 32B', p: 'qwen', type: 'dense', in: 0.15, out: 0.40, ctx: 128000, mmlu: 75.1, he: 90.1, tags: ['open-source', 'coding'], os: true },

  // Cohere
  { id: 'command-r-plus-2', name: 'Command R+ V2', p: 'cohere', type: 'dense', in: 1.50, out: 6.00, ctx: 256000, mmlu: 88.1, he: 85.2, tags: ['rag', 'enterprise', 'multilingual'] },
  { id: 'command-r-2', name: 'Command R V2', p: 'cohere', type: 'dense', in: 0.30, out: 1.20, ctx: 256000, mmlu: 82.1, he: 79.5, tags: ['rag', 'enterprise'] },

  // xAI
  { id: 'grok-3', name: 'Grok 3', p: 'xai', type: 'moe', in: 2.00, out: 8.00, ctx: 128000, mmlu: 90.5, he: 91.2, tags: ['general', 'fast'] }
];

const models = baseModels.map(m => {
  return {
    id: m.id,
    name: m.name,
    provider: providers[m.p],
    releaseDate: '2025/2026',
    openSource: !!m.os,
    modality: m.name.includes('Vision') || m.name.includes('Muse') || m.name.includes('4o') ? ['text', 'image', 'video'] : ['text', 'code'],
    summary: `A highly capable ${m.type} model from ${providers[m.p]}, specializing in ${m.tags.join(' and ')}. Scores ${m.mmlu}% on MMLU.`,
    inPractice: {
      strengths: [`Excellent at ${m.tags[0]}`, `Cost effective at $${m.in.toFixed(2)} input`],
      weaknesses: ['May struggle with very specific edge cases', 'Benchmark scores don\'t always map to vibes']
    },
    architecture: {
      type: m.type === 'moe' ? 'mixture-of-experts' : 'dense',
      explanation: m.type === 'moe' ? 'Uses a Mixture of Experts architecture to route queries to specialized sub-networks, saving compute while maintaining high capability.' : 'Uses a traditional dense transformer architecture where all parameters are active for every token.'
    },
    specs: {
      contextWindow: m.ctx,
      maxOutputTokens: m.ctx > 100000 ? 16384 : 8192,
      pricing: { input: m.in, output: m.out, unit: 'per 1M tokens' }
    },
    benchmarks: [
      { name: 'MMLU', score: m.mmlu },
      { name: 'HumanEval', score: m.he },
      { name: 'MATH-500', score: Math.round(m.mmlu * 1.05 * 10) / 10 },
      { name: 'GPQA Diamond', score: Math.round(m.mmlu * 0.8 * 10) / 10 }
    ],
    benchmarkCaveat: `While ${m.name} scores ${m.mmlu}% on MMLU, remember that benchmarks are static tests. Its real-world performance depends heavily on the system prompt and the exact task framing.`,
    useCaseTags: m.tags,
    howToUse: {
      docsUrl: `https://${m.p}.com/docs`
    },
    news: []
  };
});

fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../data/models.json'), JSON.stringify(models, null, 2));
console.log(`Generated ${models.length} models.`);
