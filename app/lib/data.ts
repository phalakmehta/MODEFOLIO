import modelsData from '@/data/models.json';
import newsData from '@/data/model-news.json';
import tagsData from '@/data/tags.json';

export type Benchmark = {
  name: string;
  score: number;
  /** Required. A score we cannot attribute is a score we do not show. */
  source: string;
};

export type NewsItem = { date: string; headline: string; url: string };

export type Model = {
  id: string;
  name: string;
  provider: string;
  /** "live" = currently callable. "legacy" = real but delisted; specs are frozen. */
  status: 'live' | 'legacy';
  retiredNote?: string;
  releaseDate: string;
  openSource: boolean;
  modality: string[];
  summary: string;
  inPractice: { strengths: string[]; weaknesses: string[] };
  architecture: { type: string; explanation: string };
  specs: {
    contextWindow: number;
    maxOutputTokens: number | null;
    pricing: { input: number; output: number; unit: string };
  };
  benchmarks: Benchmark[];
  benchmarkCaveat: string;
  useCaseTags: string[];
  howToUse: { docsUrl?: string; openRouterUrl?: string; apiExample?: string };
  lastUpdated?: string;
  updateSource?: string;
  news: NewsItem[];
};

/**
 * Every page goes through here. This file previously existed but nothing imported
 * it — each page read models.json directly, so the per-model news was merged in
 * exactly one place and then never used.
 */
export const models: Model[] = (modelsData as unknown as Omit<Model, 'news'>[]).map((model) => ({
  ...model,
  news: ((newsData as Record<string, NewsItem[]>)[model.id] ?? []),
}));

/** Models you can actually call today. The default for the directory and Wizard. */
export const liveModels = models.filter((m) => m.status === 'live');

/** Real models OpenRouter no longer lists. Kept for reference, never recommended. */
export const legacyModels = models.filter((m) => m.status === 'legacy');

export const getModelById = (id: string) => models.find((m) => m.id === id);

export const tags = tagsData as { tag: string; description: string }[];

/** Providers present in the data, with a count, for the directory filter. */
export const providers = Array.from(
  models.reduce((acc, m) => acc.set(m.provider, (acc.get(m.provider) ?? 0) + 1), new Map<string, number>()),
).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

/**
 * The CSS custom properties in globals.css only cover a handful of providers, and
 * the model detail page used to hardcode `--color-openai` for all of them, so an
 * Anthropic model was drawn in OpenAI's colour.
 */
const PROVIDER_COLORS: Record<string, string> = {
  OpenAI: 'var(--color-openai)',
  Anthropic: 'var(--color-anthropic)',
  Google: 'var(--color-google)',
  Meta: 'var(--color-meta)',
  Mistral: 'var(--color-mistral)',
  Cohere: 'var(--color-cohere)',
  DeepSeek: 'var(--color-deepseek)',
  Alibaba: 'var(--color-qwen)',
};

export const providerColor = (provider: string) => PROVIDER_COLORS[provider] ?? 'var(--accent)';

/**
 * The `name` field carries no provider prefix in the curated data, but models
 * promoted automatically from OpenRouter arrive as "OpenAI: GPT-6 Sol". Left
 * alone, the card shows the provider twice — once in the badge and once in the
 * title.
 */
export const displayName = (name: string) => (name.includes(':') ? name.split(':').slice(1).join(':').trim() : name);

/** 80% input / 20% output, the usual shape of a real workload. */
export const blendedPrice = (m: Model) => m.specs.pricing.input * 0.8 + m.specs.pricing.output * 0.2;

export const formatTokens = (n: number | null): string => {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
};

/** Prices span $0.018 to $50, so a fixed 2dp would print "$0.02" for several. */
export const formatPrice = (n: number): string => {
  if (n === 0) return '$0';
  if (n < 0.01) return `$${n.toFixed(4).replace(/0+$/, '')}`;
  if (n < 1) return `$${n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}`;
  return `$${n.toFixed(2).replace(/\.00$/, '')}`;
};
