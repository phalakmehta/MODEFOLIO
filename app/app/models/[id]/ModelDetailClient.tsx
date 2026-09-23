'use client';

import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import SpecsTable from '@/components/SpecsTable';
import { useTranslation } from '@/app/TranslationContext';

interface Model {
  id: string;
  name: string;
  provider: string;
  releaseDate: string;
  openSource: boolean;
  modality: string[];
  summary: string;
  inPractice: { strengths: string[]; weaknesses: string[] };
  architecture: { type: string; explanation: string };
  specs: {
    contextWindow: number;
    maxOutputTokens: number;
    pricing: { input: number; output: number; unit: string };
  };
  benchmarks: { name: string; score: number; rank?: number }[];
  benchmarkCaveat: string;
  useCaseTags: string[];
  howToUse: { apiExample?: string; playgroundUrl?: string; docsUrl?: string };
  news?: { date: string; headline: string; url: string }[];
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function calculateCostExample(pricing: { input: number; output: number }) {
  const inputTokens = 8000;
  const outputTokens = 2000;
  return (inputTokens / 1000000) * pricing.input + (outputTokens / 1000000) * pricing.output;
}

export default function ModelDetailClient({ model }: { model: Model }) {
  const { plainEnglish, translate } = useTranslation();
  const costExample = calculateCostExample(model.specs.pricing);
  
  const specsRows = [
    {
      label: 'Context Window',
      value: plainEnglish ? translate('context', model.specs.contextWindow) : `${formatNumber(model.specs.contextWindow)} tokens`,
      conceptTerm: 'Context Window',
    },
    {
      label: 'Max Output',
      value: plainEnglish ? 'Writes ~2,000 to 4,000 words maximum' : `${formatNumber(model.specs.maxOutputTokens)} tokens`,
      conceptTerm: 'Max Output Tokens',
    },
    {
      label: 'Input Pricing',
      value: plainEnglish ? translate('pricing', model.specs.pricing.input) : `$${model.specs.pricing.input.toFixed(2)} / 1M tokens`,
      conceptTerm: 'Input/Output Pricing',
    },
    {
      label: 'Output Pricing',
      value: plainEnglish ? translate('pricing', model.specs.pricing.output) : `$${model.specs.pricing.output.toFixed(2)} / 1M tokens`,
      conceptTerm: 'Input/Output Pricing',
    },
    {
      label: 'Architecture',
      value: plainEnglish ? translate('arch', model.architecture.type) : (model.architecture.type === 'mixture-of-experts' ? 'Mixture of Experts' : 'Dense'),
      conceptTerm: model.architecture.type === 'mixture-of-experts' ? 'Mixture of Experts (MoE)' : 'Dense Model',
    },
    {
      label: 'Modality',
      value: model.modality.join(', '),
      conceptTerm: 'Multimodal',
    },
    {
      label: 'Open Source',
      value: model.openSource ? 'Yes (Can be self-hosted)' : 'No (API only)',
      conceptTerm: 'Open Source vs Closed Source',
    },
  ];

  return (
    <div className="page-container" style={{ paddingBottom: 'var(--space-10)' }}>
      <div className="content-width" style={{ marginTop: 'var(--space-6)' }}>
        <Link href="/" className="btn" style={{ marginBottom: 'var(--space-8)' }}>
          ← Back to Directory
        </Link>

        {/* MASSIVE HEADER */}
        <ScrollReveal>
          <div className="model-detail-header" style={{ borderBottom: '4px solid var(--text-primary)', paddingBottom: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <div className="model-detail-provider" style={{ fontSize: '18px', color: 'var(--color-openai)' }}>{model.provider}</div>
            <h1 className="model-detail-name" style={{ fontSize: 'var(--text-massive)', wordWrap: 'break-word', hyphens: 'auto' }}>
              {model.name.toLowerCase()}
            </h1>
            <p className="model-detail-summary" style={{ fontSize: 'var(--text-2xl)', lineHeight: 1.3, color: 'var(--text-primary)', fontWeight: 600 }}>
              {model.summary}
            </p>
            <div className="model-detail-badges" style={{ marginTop: 'var(--space-5)' }}>
              {model.useCaseTags.map((tag) => (
                <span key={tag} className="badge" style={{ fontSize: '14px', padding: '6px 12px', border: '2px solid var(--text-primary)' }}>{tag}</span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* IN PRACTICE BLOCK */}
        <ScrollReveal>
          <div className="pudding-block" style={{ backgroundColor: 'var(--color-anthropic)', color: 'var(--bg-primary)' }}>
            <h2 className="pudding-section-title">In Practice</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-5)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>What it rules at</h3>
                <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)' }}>
                  {model.inPractice.strengths.map((s, i) => <li key={i} style={{ marginBottom: '8px' }}>+ {s}</li>)}
                </ul>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>Where it fails</h3>
                <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', opacity: 0.8 }}>
                  {model.inPractice.weaknesses.map((w, i) => <li key={i} style={{ marginBottom: '8px' }}>- {w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* THE RAW SPECS */}
        <ScrollReveal>
          <div style={{ marginTop: 'var(--space-10)', marginBottom: 'var(--space-10)' }}>
            <h2 className="pudding-section-title" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>The Raw Specs</h2>
            <div style={{ borderTop: '4px solid var(--text-primary)' }}>
              <SpecsTable specs={specsRows} />
            </div>
          </div>
        </ScrollReveal>

        {/* ARCHITECTURE & COST GRID */}
        <ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginTop: 'var(--space-8)' }}>
            <div className="pudding-block" style={{ backgroundColor: 'var(--color-google)', color: 'var(--bg-primary)' }}>
              <h2 className="pudding-section-title" style={{ fontSize: 'var(--text-4xl)' }}>Architecture</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: 'var(--space-4) 0' }}>
                {plainEnglish ? translate('arch', model.architecture.type) : (model.architecture.type === 'mixture-of-experts' ? 'Mixture of Experts' : 'Dense')}
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--bg-primary)', fontWeight: 600 }}>
                {model.architecture.explanation}
              </p>
            </div>
            
            <div className="pudding-block" style={{ backgroundColor: 'var(--color-mistral)', color: 'var(--bg-primary)' }}>
              <h2 className="pudding-section-title" style={{ fontSize: 'var(--text-4xl)' }}>Cost Profile</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: 'var(--space-4) 0' }}>
                {plainEnglish ? translate('pricing', model.specs.pricing.input) : `$${model.specs.pricing.input.toFixed(2)} / 1M tokens`}
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--bg-primary)', fontWeight: 600 }}>
                Example typical run: {plainEnglish ? (costExample < 0.01 ? 'Basically free' : 'A few cents') : (costExample < 0.01 ? '< $0.01' : `≈ $${costExample.toFixed(4)}`)}
              </p>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
