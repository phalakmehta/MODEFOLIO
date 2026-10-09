'use client';

import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import SpecsTable from '@/components/SpecsTable';
import { useTranslation } from '@/app/TranslationContext';
import { Model, displayName, formatTokens, formatPrice, providerColor } from '@/lib/data';

/** 8K in, 2K out — a realistic single request, not a round million. */
function costExample(pricing: { input: number; output: number }) {
  return (8_000 / 1_000_000) * pricing.input + (2_000 / 1_000_000) * pricing.output;
}

export default function ModelDetailClient({ model }: { model: Model }) {
  const { plainEnglish, translate, shortLabel } = useTranslation();
  const cost = costExample(model.specs.pricing);
  const { contextWindow, maxOutputTokens, pricing } = model.specs;

  const specsRows = [
    {
      label: 'Context Window',
      value: plainEnglish
        ? translate('context', contextWindow)
        : `${formatTokens(contextWindow)} tokens`,
      conceptTerm: 'Context Window',
    },
    {
      label: 'Max Output',
      // This was a hardcoded "Writes ~2,000 to 4,000 words maximum" for every
      // model, regardless of the real limit.
      value: plainEnglish
        ? translate('maxOutput', maxOutputTokens ?? 0)
        : maxOutputTokens
          ? `${formatTokens(maxOutputTokens)} tokens`
          : 'Not published',
      conceptTerm: 'Max Output Tokens',
    },
    {
      label: 'Input Pricing',
      value: plainEnglish
        ? translate('pricing', pricing.input)
        : `${formatPrice(pricing.input)} / 1M tokens`,
      conceptTerm: 'Input/Output Pricing',
    },
    {
      label: 'Output Pricing',
      value: plainEnglish
        ? translate('pricing', pricing.output)
        : `${formatPrice(pricing.output)} / 1M tokens`,
      conceptTerm: 'Input/Output Pricing',
    },
    {
      label: 'Architecture',
      value: plainEnglish
        ? translate('arch', model.architecture.type)
        : shortLabel('arch', model.architecture.type),
      conceptTerm:
        model.architecture.type === 'mixture-of-experts'
          ? 'Mixture of Experts (MoE)'
          : 'Dense Model',
    },
    { label: 'Modality', value: model.modality.join(', '), conceptTerm: 'Multimodal' },
    {
      label: 'Open Weights',
      value: model.openSource ? 'Yes — you can download and self-host it' : 'No — API only',
      conceptTerm: 'Open Source vs Closed Source',
    },
    { label: 'Released', value: model.releaseDate || 'Not published' },
  ];

  return (
    <div className="page-container" style={{ paddingBottom: 'var(--space-10)' }}>
      <div className="content-width" style={{ marginTop: 'var(--space-6)' }}>
        <Link href="/" className="btn" style={{ marginBottom: 'var(--space-8)' }}>
          ← Back to Directory
        </Link>

        {model.status === 'legacy' && (
          <div
            style={{
              border: '2px solid var(--text-primary)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
              background: 'var(--bg-secondary)',
            }}
          >
            <strong className="mono" style={{ textTransform: 'uppercase', fontSize: 'var(--text-sm)' }}>
              No longer available
            </strong>
            <p style={{ marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
              {model.retiredNote}. The specs below are frozen at their last published
              values and are not being refreshed. This page is here for reference —
              you cannot call this model today.
            </p>
          </div>
        )}

        <ScrollReveal>
          <div
            className="model-detail-header"
            style={{
              borderBottom: '4px solid var(--text-primary)',
              paddingBottom: 'var(--space-6)',
              marginBottom: 'var(--space-8)',
            }}
          >
            {/* Was hardcoded to var(--color-openai) for every provider. */}
            <div
              className="model-detail-provider"
              style={{ fontSize: '18px', color: providerColor(model.provider) }}
            >
              {model.provider}
            </div>
            <h1
              className="model-detail-name"
              style={{ fontSize: 'var(--text-massive)', wordWrap: 'break-word', hyphens: 'auto' }}
            >
              {displayName(model.name).toLowerCase()}
            </h1>
            <p
              className="model-detail-summary"
              style={{
                fontSize: 'var(--text-2xl)',
                lineHeight: 1.3,
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {model.summary}
            </p>
            <div className="model-detail-badges" style={{ marginTop: 'var(--space-5)' }}>
              {model.openSource && (
                <span
                  className="badge"
                  style={{ fontSize: '14px', padding: '6px 12px', border: '2px solid var(--text-primary)' }}
                >
                  open weights
                </span>
              )}
              {model.useCaseTags.map((tag) => (
                <span
                  key={tag}
                  className="badge"
                  style={{ fontSize: '14px', padding: '6px 12px', border: '2px solid var(--text-primary)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="pudding-block" style={{ backgroundColor: 'var(--color-anthropic)', color: 'var(--bg-primary)' }}>
            <h2 className="pudding-section-title">In Practice</h2>
            <div className="responsive-grid-2" style={{ marginTop: 'var(--space-5)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                  What it rules at
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)' }}>
                  {model.inPractice.strengths.map((s, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>+ {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                  Where it fails
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', opacity: 0.8 }}>
                  {model.inPractice.weaknesses.map((w, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>- {w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div style={{ marginTop: 'var(--space-10)', marginBottom: 'var(--space-10)' }}>
            <h2 className="pudding-section-title" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-6)' }}>
              The Raw Specs
            </h2>
            <div style={{ borderTop: '4px solid var(--text-primary)' }}>
              <SpecsTable specs={specsRows} />
            </div>
            {model.lastUpdated && (
              <p className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-3)' }}>
                Specs last checked against the OpenRouter API on {model.lastUpdated}.
              </p>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="responsive-grid-2" style={{ marginTop: 'var(--space-8)' }}>
            <div className="pudding-block" style={{ backgroundColor: 'var(--color-google)', color: 'var(--bg-primary)' }}>
              <h2 className="pudding-section-title" style={{ fontSize: 'var(--text-4xl)' }}>Architecture</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: 'var(--space-4) 0' }}>
                {shortLabel('arch', model.architecture.type)}
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--bg-primary)', fontWeight: 600 }}>
                {model.architecture.explanation}
              </p>
            </div>

            <div className="pudding-block" style={{ backgroundColor: 'var(--color-mistral)', color: 'var(--bg-primary)' }}>
              <h2 className="pudding-section-title" style={{ fontSize: 'var(--text-4xl)' }}>Cost Profile</h2>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', fontWeight: 700, margin: 'var(--space-4) 0' }}>
                {plainEnglish ? translate('pricing', pricing.input) : `${formatPrice(pricing.input)} / 1M tokens`}
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', color: 'var(--bg-primary)', fontWeight: 600 }}>
                A typical request — roughly 6,000 words in, 1,500 words out — costs{' '}
                {cost < 0.01 ? 'less than a cent' : `about $${cost.toFixed(3)}`}.
                {' '}A thousand of them cost {cost * 1000 < 1 ? `under $1` : `about $${(cost * 1000).toFixed(0)}`}.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Benchmarks were in the props interface but never rendered. When there
            are no sourced scores we say so, rather than quietly showing nothing. */}
        <ScrollReveal>
          <div style={{ marginTop: 'var(--space-10)' }}>
            <h2 className="pudding-section-title" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              Benchmarks
            </h2>
            {model.benchmarks.length > 0 ? (
              <table className="specs-table" style={{ borderTop: '4px solid var(--text-primary)' }}>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Score</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {model.benchmarks.map((b) => (
                    <tr key={b.name}>
                      <td>{b.name}</td>
                      <td>
                        <span className="mono">{b.score}</span>
                        {plainEnglish && (
                          <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)' }}>
                            — {translate('benchmark', b.score)}
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{b.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            <p
              style={{
                color: 'var(--text-secondary)',
                marginTop: 'var(--space-4)',
                borderLeft: '3px solid var(--accent)',
                paddingLeft: 'var(--space-4)',
              }}
            >
              {model.benchmarkCaveat}
            </p>
          </div>
        </ScrollReveal>

        {/* Also previously declared and never rendered. */}
        {model.news.length > 0 && (
          <ScrollReveal>
            <div style={{ marginTop: 'var(--space-10)' }}>
              <h2 className="pudding-section-title" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
                In the News
              </h2>
              <div style={{ borderTop: '4px solid var(--text-primary)' }}>
                {model.news.map((item) => (
                  <a
                    key={item.url}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: 'var(--space-4) 0',
                      borderBottom: '1px solid var(--border)',
                      color: 'inherit',
                      textDecoration: 'none',
                    }}
                  >
                    <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {item.date}
                    </span>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', marginTop: '4px' }}>
                      {item.headline}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* And the docs links. */}
        {(model.howToUse.docsUrl || model.howToUse.openRouterUrl) && (
          <ScrollReveal>
            <div style={{ marginTop: 'var(--space-10)' }}>
              <h2 className="pudding-section-title" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
                How to Use It
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                {model.howToUse.docsUrl && (
                  <a className="btn" href={model.howToUse.docsUrl} target="_blank" rel="noopener noreferrer">
                    Provider docs →
                  </a>
                )}
                {model.howToUse.openRouterUrl && (
                  <a className="btn" href={model.howToUse.openRouterUrl} target="_blank" rel="noopener noreferrer">
                    Try it on OpenRouter →
                  </a>
                )}
                <Link className="btn" href={`/compare?models=${model.id}`}>
                  Compare it →
                </Link>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
