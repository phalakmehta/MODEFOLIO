'use client';

import { useState, useMemo } from 'react';
import models from '@/data/models.json';
import Link from 'next/link';

type Model = typeof models[0];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

interface ModelSelectorProps {
  index: number;
  selected: Model | null;
  onSelect: (model: Model | null) => void;
  usedIds: string[];
}

function ModelSelector({ index, selected, onSelect, usedIds }: ModelSelectorProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return models
      .filter((m) => !usedIds.includes(m.id))
      .filter((m) =>
        !query || m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.provider.toLowerCase().includes(query.toLowerCase())
      );
  }, [query, usedIds]);

  if (selected) {
    return (
      <div className="model-selector-slot">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          border: '1px solid var(--accent)',
          borderRadius: '8px',
          background: 'var(--accent-light)',
        }}>
          <div>
            <span className="model-card-provider" style={{ fontSize: '10px' }}>{selected.provider}</span>
            <br />
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-base)' }}>{selected.name}</span>
          </div>
          <button
            className="btn btn--ghost"
            onClick={() => { onSelect(null); setQuery(''); }}
            style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="model-selector-slot">
      <input
        type="text"
        className="model-selector-input"
        placeholder={`Select model ${index + 1}...`}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && filtered.length > 0 && (
        <div className="model-selector-dropdown">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="model-selector-option"
              onMouseDown={() => { onSelect(m); setOpen(false); setQuery(''); }}
            >
              <span className="provider" style={{ marginRight: '8px' }}>{m.provider}</span>
              {m.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CompareRow {
  label: string;
  values: (string | number)[];
  highlight?: boolean;
  isMono?: boolean;
}

export default function CompareClient() {
  const [selected, setSelected] = useState<(Model | null)[]>([null, null, null]);

  const activeModels = selected.filter(Boolean) as Model[];
  const usedIds = activeModels.map((m) => m.id);

  const setModel = (index: number, model: Model | null) => {
    setSelected((prev) => {
      const next = [...prev];
      next[index] = model;
      return next;
    });
  };

  const rows: CompareRow[] = activeModels.length >= 2 ? [
    {
      label: 'Provider',
      values: activeModels.map((m) => m.provider),
    },
    {
      label: 'Context Window',
      values: activeModels.map((m) => formatNumber(m.specs.contextWindow)),
      isMono: true,
      highlight: true,
    },
    {
      label: 'Max Output',
      values: activeModels.map((m) => formatNumber(m.specs.maxOutputTokens)),
      isMono: true,
    },
    {
      label: 'Input Price / 1M tokens',
      values: activeModels.map((m) => `$${m.specs.pricing.input.toFixed(2)}`),
      isMono: true,
      highlight: true,
    },
    {
      label: 'Output Price / 1M tokens',
      values: activeModels.map((m) => `$${m.specs.pricing.output.toFixed(2)}`),
      isMono: true,
      highlight: true,
    },
    {
      label: 'Architecture',
      values: activeModels.map((m) => m.architecture.type === 'mixture-of-experts' ? 'MoE' : 'Dense'),
    },
    {
      label: 'Open Source',
      values: activeModels.map((m) => m.openSource ? 'Yes' : 'No'),
    },
    {
      label: 'Modality',
      values: activeModels.map((m) => m.modality.join(', ')),
    },
    ...getBenchmarkRows(activeModels),
    {
      label: 'Best For',
      values: activeModels.map((m) => m.useCaseTags.join(', ')),
    },
  ] : [];

  return (
    <div className="page-container">
      <section className="hero">
        <h1>Compare models side by side</h1>
        <p className="hero-subtitle">
          Select 2&ndash;3 models to see how they stack up on specs, pricing, and benchmarks.
        </p>
      </section>

      <div className="model-selector">
        {selected.map((model, i) => (
          <ModelSelector
            key={i}
            index={i}
            selected={model}
            onSelect={(m) => setModel(i, m)}
            usedIds={usedIds}
          />
        ))}
      </div>

      {activeModels.length >= 2 && (
        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              {activeModels.map((m) => (
                <th key={m.id} className="compare-header-model">
                  <Link href={`/models/${m.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {m.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const bestIdx = row.highlight ? findBest(row) : -1;
              return (
                <tr key={i}>
                  <td>{row.label}</td>
                  {row.values.map((val, j) => (
                    <td
                      key={j}
                      className={bestIdx === j ? 'compare-highlight' : ''}
                    >
                      <span className={row.isMono ? 'mono' : ''}>
                        <span className={bestIdx === j ? 'compare-best' : ''}>
                          {val}
                        </span>
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {activeModels.length < 2 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-9) 0', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: 'var(--text-lg)' }}>Select at least 2 models to compare</p>
        </div>
      )}
    </div>
  );
}

function getBenchmarkRows(activeModels: Model[]): CompareRow[] {
  const allBenchmarks = new Set<string>();
  activeModels.forEach((m) => m.benchmarks.forEach((b) => allBenchmarks.add(b.name)));

  return Array.from(allBenchmarks).map((name) => ({
    label: name,
    values: activeModels.map((m) => {
      const b = m.benchmarks.find((bench) => bench.name === name);
      return b ? `${b.score}%` : '—';
    }),
    isMono: true,
    highlight: true,
  }));
}

function findBest(row: CompareRow): number {
  const isPricing = row.label.toLowerCase().includes('price');
  const nums = row.values.map((v) => {
    const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? null : n;
  });

  let bestIdx = -1;
  let bestVal: number | null = null;

  nums.forEach((n, i) => {
    if (n === null) return;
    if (bestVal === null) {
      bestVal = n;
      bestIdx = i;
    } else if (isPricing ? n < bestVal : n > bestVal) {
      bestVal = n;
      bestIdx = i;
    }
  });

  return bestIdx;
}
