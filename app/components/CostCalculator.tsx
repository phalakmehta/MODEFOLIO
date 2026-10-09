'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Model, displayName, formatPrice } from '@/lib/data';

/**
 * "$ per 1M tokens" means nothing to most people. This turns it into a monthly
 * bill for a workload they recognise. A token is about three-quarters of a word.
 */
const USAGE = [
  { key: 'chat', label: 'Chat', input: 1_500, output: 400, hint: 'a chat reply with some conversation history: ~1,100 words in, ~300 out' },
  { key: 'docs', label: 'Summaries', input: 8_000, output: 600, hint: 'summarising a document: ~6,000 words in, ~450 out' },
  { key: 'code', label: 'Coding', input: 6_000, output: 1_500, hint: 'coding help: a few files of context in, a change out' },
  { key: 'bulk', label: 'Tagging', input: 400, output: 20, hint: 'classifying short items: a paragraph in, a label out' },
] as const;

const VOLUMES = [10, 100, 1_000, 10_000];
const DAYS_PER_MONTH = 30;

export function formatMoney(n: number): string {
  if (n === 0) return '$0';
  if (n < 0.01) return 'under 1¢';
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export default function CostCalculator({
  models,
  title = 'What would it cost you?',
}: {
  models: Model[];
  title?: string;
}) {
  const [usageKey, setUsageKey] = useState<(typeof USAGE)[number]['key']>('chat');
  const [perDay, setPerDay] = useState(100);

  if (models.length === 0) return null;

  const usage = USAGE.find((u) => u.key === usageKey) ?? USAGE[0];
  const perRequest = (m: Model) =>
    (usage.input / 1e6) * m.specs.pricing.input + (usage.output / 1e6) * m.specs.pricing.output;

  const rows = models
    .map((m) => ({ model: m, request: perRequest(m), month: perRequest(m) * perDay * DAYS_PER_MONTH }))
    .sort((a, b) => a.month - b.month);
  const max = Math.max(...rows.map((r) => r.month), 0);
  const single = rows.length === 1;

  const chip = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--text-primary)' : 'transparent',
    color: active ? 'var(--bg-primary)' : 'inherit',
    fontSize: 'var(--text-xs)',
    padding: '4px 10px',
  });

  return (
    <section className="cost-calc" aria-label="Monthly cost calculator">
      <h2 className="cost-calc-title">{title}</h2>

      <div className="cost-calc-controls">
        <div role="group" aria-label="What you use it for" className="cost-calc-row">
          <span className="cost-calc-label">Use</span>
          {USAGE.map((u) => (
            <button
              key={u.key}
              className="btn"
              style={chip(u.key === usageKey)}
              aria-pressed={u.key === usageKey}
              onClick={() => setUsageKey(u.key)}
            >
              {u.label}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Requests per day" className="cost-calc-row">
          <span className="cost-calc-label">Per day</span>
          {VOLUMES.map((v) => (
            <button
              key={v}
              className="btn"
              style={chip(v === perDay)}
              aria-pressed={v === perDay}
              onClick={() => setPerDay(v)}
            >
              {v.toLocaleString('en-US')}
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={10_000_000}
            value={perDay}
            onChange={(e) => setPerDay(Math.max(1, Math.min(10_000_000, Math.round(Number(e.target.value) || 1))))}
            aria-label="Custom number of requests per day"
            className="cost-calc-input"
          />
        </div>
      </div>

      <p className="cost-calc-hint">
        Each request is {usage.hint}. {perDay.toLocaleString('en-US')} a day, for {DAYS_PER_MONTH} days.
      </p>

      {single ? (
        <div className="cost-calc-single">
          <span className="cost-calc-big">{formatMoney(rows[0].month)}</span>
          <span className="cost-calc-unit"> / month</span>
          <div className="cost-calc-sub">{formatMoney(rows[0].request)} per request</div>
        </div>
      ) : (
        <ul className="cost-calc-bars">
          {rows.map(({ model, request, month }) => (
            <li key={model.id} title={`${formatMoney(request)} per request · ${formatPrice(model.specs.pricing.input)} in / ${formatPrice(model.specs.pricing.output)} out per 1M tokens`}>
              <Link href={`/models/${model.id}`} className="cost-calc-name">
                {displayName(model.name)}
                {model.status === 'legacy' && <span className="cost-calc-retired"> (retired)</span>}
              </Link>
              <div className="cost-calc-track">
                <div
                  className="cost-calc-bar"
                  style={{ width: max > 0 ? `max(2px, ${(month / max) * 100}%)` : '2px' }}
                />
              </div>
              <span className="cost-calc-value">
                {formatMoney(month)}
                <span className="cost-calc-unit">/mo</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="cost-calc-note">
        List prices from OpenRouter. Real bills vary with prompt length, caching and retries.
      </p>
    </section>
  );
}
