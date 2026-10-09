'use client';

import Link from 'next/link';
import { useTranslation } from '@/app/TranslationContext';
import { Model, displayName, formatTokens, formatPrice, providerColor } from '@/lib/data';

interface ModelCardProps {
  model: Model;
  view?: 'grid' | 'list';
}

function priceTier(input: number): string {
  if (input <= 0.5) return '$';
  if (input <= 3) return '$$';
  return '$$$';
}

export default function ModelCard({ model, view = 'grid' }: ModelCardProps) {
  const { plainEnglish, shortLabel } = useTranslation();
  const { input, output } = model.specs.pricing;

  // In plain-English mode this used to be `translate('pricing', input).split(' ')[0]`,
  // which collapsed "Very Expensive" and "Very Cheap" to the same word.
  const badge = plainEnglish ? shortLabel('pricing', input) : priceTier(input);

  return (
    <Link
      href={`/models/${model.id}`}
      className={`model-card-wrapper ${view === 'list' ? 'list-view' : ''}`}
      id={`model-card-${model.id}`}
      data-provider={model.provider}
    >
      <div className="model-card-visual">
        <div className="model-card-inner">
          <div className="model-card-header">
            <span className="model-card-provider" style={{ color: providerColor(model.provider) }}>
              {model.provider}
            </span>
            <span className="price-badge" style={{ fontSize: plainEnglish ? '10px' : '12px' }}>
              {badge}
            </span>
          </div>

          <p className="model-card-summary">{model.summary}</p>

          <div
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              display: 'flex',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
              marginTop: 'var(--space-2)',
            }}
          >
            <span>{formatTokens(model.specs.contextWindow)} ctx</span>
            <span>
              {formatPrice(input)} / {formatPrice(output)}
            </span>
            {model.releaseDate && <span>{model.releaseDate.slice(0, 7)}</span>}
          </div>

          <div className="model-card-meta">
            {model.status === 'legacy' && (
              <span
                className="badge"
                style={{ borderColor: 'var(--text-tertiary)', color: 'var(--text-tertiary)' }}
                title={model.retiredNote}
              >
                Legacy
              </span>
            )}
            {model.openSource && <span className="badge badge--open">Open weights</span>}
            {model.useCaseTags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Lowercasing is the editorial style, but it was applied to the raw name,
          so an auto-promoted "OpenAI: GPT-6 Sol" rendered as "openai: gpt-6 sol"
          directly beneath a provider badge already reading "OpenAI". */}
      <h3 className="model-card-title">{displayName(model.name).toLowerCase()}</h3>
    </Link>
  );
}
