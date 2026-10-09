'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { models, Model, getModelById, displayName, formatTokens, formatPrice } from '@/lib/data';
import { useQueryParams, listParam } from '@/lib/useQueryParams';
import CostCalculator from '@/components/CostCalculator';
import ShareButton from '@/components/ShareButton';

const SLOTS = 3;

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
        !query || displayName(m.name).toLowerCase().includes(query.toLowerCase()) ||
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
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-base)' }}>{displayName(selected.name)}</span>
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
              {displayName(m.name)}
              {m.status === 'legacy' && (
                <span className="badge" style={{ marginLeft: '8px', fontSize: '10px' }}>retired</span>
              )}
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
  /** Raw comparable numbers. Never derive these from `values` -- the formatted
   *  strings are lossy: "1.0M" parses as 1.0 and loses to "400K" -> 400. */
  raw?: (number | null)[];
  /** 'high' = bigger is better, 'low' = cheaper is better. */
  better?: 'high' | 'low';
  isMono?: boolean;
}

export default function CompareClient() {
  // The selection lives in the URL (?models=a,b,c). That makes a comparison
  // shareable, and it is what the detail page's "Compare it" link relies on.
  const [params, setParams] = useQueryParams();
  const selected = useMemo(() => {
    const picked: Model[] = [];
    for (const id of listParam(params, 'models')) {
      const m = getModelById(id);
      if (m && !picked.some((p) => p.id === m.id)) picked.push(m);
    }
    return [...picked.slice(0, SLOTS), ...Array<null>(SLOTS).fill(null)].slice(0, SLOTS);
  }, [params]);

  const activeModels = selected.filter(Boolean) as Model[];
  const usedIds = activeModels.map((m) => m.id);

  const setModel = (index: number, model: Model | null) => {
    const next = [...selected];
    next[index] = model;
    setParams({ models: next.filter((m): m is Model => m !== null).map((m) => m.id) });
  };

  const rows: CompareRow[] = activeModels.length >= 2 ? [
    {
      label: 'Status',
      values: activeModels.map((m) => (m.status === 'legacy' ? 'Retired - cannot be called' : 'Available')),
    },
    {
      label: 'Provider',
      values: activeModels.map((m) => m.provider),
    },
    {
      label: 'Released',
      values: activeModels.map((m) => m.releaseDate || '-'),
      isMono: true,
    },
    {
      label: 'Context Window',
      values: activeModels.map((m) => formatTokens(m.specs.contextWindow) + ' tokens'),
      raw: activeModels.map((m) => m.specs.contextWindow),
      better: 'high',
      isMono: true,
    },
    {
      label: 'Max Output',
      values: activeModels.map((m) =>
        m.specs.maxOutputTokens ? formatTokens(m.specs.maxOutputTokens) + ' tokens' : 'Not published',
      ),
      raw: activeModels.map((m) => m.specs.maxOutputTokens),
      better: 'high',
      isMono: true,
    },
    {
      label: 'Input Price / 1M tokens',
      values: activeModels.map((m) => formatPrice(m.specs.pricing.input)),
      raw: activeModels.map((m) => m.specs.pricing.input),
      better: 'low',
      isMono: true,
    },
    {
      label: 'Output Price / 1M tokens',
      values: activeModels.map((m) => formatPrice(m.specs.pricing.output)),
      raw: activeModels.map((m) => m.specs.pricing.output),
      better: 'low',
      isMono: true,
    },
    {
      label: 'Cost of 1,000 typical requests',
      values: activeModels.map((m) => {
        const cost = ((8000 / 1e6) * m.specs.pricing.input + (2000 / 1e6) * m.specs.pricing.output) * 1000;
        return cost < 1 ? 'under $1' : '$' + cost.toFixed(0);
      }),
      raw: activeModels.map(
        (m) => (8000 / 1e6) * m.specs.pricing.input + (2000 / 1e6) * m.specs.pricing.output,
      ),
      better: 'low',
      isMono: true,
    },
    {
      label: 'Architecture',
      values: activeModels.map((m) =>
        m.architecture.type === 'mixture-of-experts'
          ? 'Mixture of Experts'
          : m.architecture.type === 'dense'
            ? 'Dense'
            : 'Undisclosed',
      ),
    },
    {
      label: 'Open Weights',
      values: activeModels.map((m) => (m.openSource ? 'Yes - self-hostable' : 'No - API only')),
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
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-3)' }}>
          <ShareButton label="Share this comparison" />
        </div>
      )}

      {activeModels.length >= 2 && (
        <div className="compare-table-wrapper">
        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              {activeModels.map((m) => (
                <th key={m.id} className="compare-header-model">
                  <Link href={`/models/${m.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {displayName(m.name)}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const bestIdx = row.better ? findBest(row) : -1;
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
        </div>
      )}

      {activeModels.length >= 2 && <CostCalculator models={activeModels} />}

      {activeModels.length < 2 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-9) 0', color: 'var(--text-tertiary)' }}>
          <p style={{ fontSize: 'var(--text-lg)' }}>
            {activeModels.length === 1
              ? `Pick one more model to compare with ${displayName(activeModels[0].name)}`
              : 'Select at least 2 models to compare'}
          </p>
        </div>
      )}
    </div>
  );
}

function getBenchmarkRows(activeModels: Model[]): CompareRow[] {
  const allBenchmarks = new Set<string>();
  activeModels.forEach((m) => m.benchmarks.forEach((b) => allBenchmarks.add(b.name)));

  return Array.from(allBenchmarks).map((name) => ({
    // The score used to be rendered with a '%' appended, which is not the unit
    // every benchmark reports in. Show the number as published, and say plainly
    // that the vendor is the one reporting it.
    label: name + ' (vendor-reported)',
    values: activeModels.map((m) => {
      const b = m.benchmarks.find((bench) => bench.name === name);
      return b ? String(b.score) : '-';
    }),
    raw: activeModels.map((m) => m.benchmarks.find((bench) => bench.name === name)?.score ?? null),
    better: 'high' as const,
    isMono: true,
  }));
}

function findBest(row: CompareRow): number {
  if (!row.raw || !row.better) return -1;

  let bestIdx = -1;
  let bestVal: number | null = null;

  row.raw.forEach((n, i) => {
    if (n === null || n === undefined) return;
    if (bestVal === null || (row.better === 'low' ? n < bestVal : n > bestVal)) {
      bestVal = n;
      bestIdx = i;
    }
  });

  // Highlighting every cell says nothing, so skip it when they all tie.
  const best = bestVal;
  if (bestIdx !== -1 && row.raw.every((n) => n === best)) return -1;
  return bestIdx;
}
