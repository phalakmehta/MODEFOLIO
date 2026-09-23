'use client';

import Link from 'next/link';
import { useTranslation } from '@/app/TranslationContext';

interface Model {
  id: string;
  name: string;
  provider: string;
  summary: string;
  openSource: boolean;
  useCaseTags: string[];
  specs: {
    pricing: { input: number; output: number };
  };
}

interface ModelCardProps {
  model: Model;
  view?: 'grid' | 'list';
}

function getPriceTier(input: number): { label: string; className: string } {
  if (input <= 0.5) return { label: '$', className: 'price-badge' };
  if (input <= 3) return { label: '$$', className: 'price-badge' };
  return { label: '$$$', className: 'price-badge' };
}

export default function ModelCard({ model, view = 'grid' }: ModelCardProps) {
  const { plainEnglish, translate } = useTranslation();
  const priceTier = getPriceTier(model.specs.pricing.input);
  
  const displayPrice = plainEnglish 
    ? translate('pricing', model.specs.pricing.input).split(' ')[0]
    : priceTier.label;

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
            <span className="model-card-provider">{model.provider}</span>
            <span className={plainEnglish ? 'badge' : priceTier.className} style={{ fontSize: plainEnglish ? '10px' : '12px' }}>
              {displayPrice}
            </span>
          </div>

          <p className="model-card-summary">{model.summary}</p>

          <div className="model-card-meta">
            {model.openSource && (
              <span className="badge badge--open">Open Source</span>
            )}
            {model.useCaseTags.slice(0, 3).map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        </div>
      </div>
      
      <h3 className="model-card-title">{model.name.toLowerCase()}</h3>
    </Link>
  );
}
