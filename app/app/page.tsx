'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import { models, liveModels, tags, providers, blendedPrice, displayName } from '@/lib/data';
import ModelCard from '@/components/ModelCard';
import ShareButton from '@/components/ShareButton';
import { useTranslation } from '@/app/TranslationContext';
import { useQueryParams, listParam } from '@/lib/useQueryParams';

type SortKey = 'newest' | 'cheapest' | 'context' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'cheapest', label: 'Cheapest' },
  { key: 'context', label: 'Biggest context' },
  { key: 'name', label: 'A–Z' },
];

// Anything in the URL is user input; ignore values that do not exist.
const TAG_NAMES = new Set(tags.map((t) => t.tag));
const PROVIDER_NAMES = new Set(providers.map(([name]) => name));
const isSortKey = (v: string | null): v is SortKey => SORTS.some((s) => s.key === v);

export default function HomePage() {
  const { plainEnglish } = useTranslation();

  // Filters live in the URL (?q=&tags=&provider=&sort=&open=1&retired=1), so a
  // filtered view can be bookmarked or shared.
  const [params, setParams] = useQueryParams();
  const search = params.get('q') ?? '';
  const showOpenOnly = params.get('open') === '1';
  const includeLegacy = params.get('retired') === '1';
  const activeTags = useMemo(() => listParam(params, 'tags').filter((t) => TAG_NAMES.has(t)), [params]);
  const providerParam = params.get('provider') ?? '';
  const activeProvider = PROVIDER_NAMES.has(providerParam) ? providerParam : '';
  const sortParam = params.get('sort');
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'newest';

  const pool = includeLegacy ? models : liveModels;

  const fuse = useMemo(
    () => new Fuse(pool, { keys: ['name', 'provider', 'useCaseTags', 'summary'], threshold: 0.3 }),
    [pool],
  );

  const filtered = useMemo(() => {
    let result = search ? fuse.search(search).map((r) => r.item) : [...pool];

    if (showOpenOnly) result = result.filter((m) => m.openSource);
    if (activeProvider) result = result.filter((m) => m.provider === activeProvider);
    // Every selected tag must be present, so stacking filters narrows rather than widens.
    if (activeTags.length) result = result.filter((m) => activeTags.every((t) => m.useCaseTags.includes(t)));

    // Fuse already orders by relevance, so only re-sort when there is no query.
    if (!search) {
      result.sort((a, b) => {
        switch (sort) {
          case 'cheapest':
            return blendedPrice(a) - blendedPrice(b);
          case 'context':
            return b.specs.contextWindow - a.specs.contextWindow;
          case 'name':
            return displayName(a.name).localeCompare(displayName(b.name));
          default:
            return b.releaseDate.localeCompare(a.releaseDate);
        }
      });
    }
    return result;
  }, [search, showOpenOnly, activeProvider, activeTags, sort, fuse, pool]);

  const toggleTag = (tag: string) =>
    setParams({ tags: activeTags.includes(tag) ? activeTags.filter((t) => t !== tag) : [...activeTags, tag] });

  const clearAll = () => setParams({ q: null, open: null, tags: null, provider: null, retired: null });

  const hasFilters = Boolean(search || showOpenOnly || activeTags.length || activeProvider || includeLegacy);

  // Computed from the data so the hero cannot drift out of date.
  const cheapest = useMemo(() => [...liveModels].sort((a, b) => blendedPrice(a) - blendedPrice(b))[0], []);
  const priceSpread = useMemo(() => {
    const dearest = [...liveModels].sort((a, b) => blendedPrice(b) - blendedPrice(a))[0];
    return Math.round(blendedPrice(dearest) / Math.max(blendedPrice(cheapest), 0.001));
  }, [cheapest]);

  return (
    <div className="page-container">
      {/* The directory is the product, so it opens on the directory. The essay
          that used to sit here cost ~3.4 screens before the first model. */}
      <header className="home-hero">
        <h1 className="home-title">Every model you can actually call, with the real price.</h1>
        <p className="home-deck">
          {liveModels.length} models from {providers.length} providers. Prices and limits come
          straight from the OpenRouter API every Monday &mdash; we never type a number by hand.
        </p>
        <Link href="/why" className="home-why">
          Why most model comparisons mislead you &rarr;
        </Link>
      </header>

      <div className="quick-stats-grid">
        <div className="quick-stat-box">
          <div className="quick-stat-val">{liveModels.length}</div>
          <div className="quick-stat-lbl">Models live</div>
        </div>
        <div className="quick-stat-box">
          <div className="quick-stat-val">{providers.length}</div>
          <div className="quick-stat-lbl">Providers</div>
        </div>
        <div className="quick-stat-box">
          <div className="quick-stat-val">${blendedPrice(cheapest).toFixed(2)}</div>
          <div className="quick-stat-lbl">Cheapest / 1M</div>
        </div>
        <div className="quick-stat-box">
          <div className="quick-stat-val">{priceSpread}&times;</div>
          <div className="quick-stat-lbl">Price spread</div>
        </div>
      </div>

      <section className="home-directory">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="field field--search"
              placeholder={`Search ${pool.length} models...`}
              value={search}
              onChange={(e) => setParams({ q: e.target.value })}
              aria-label="Search models"
            />
            <select
              className="field"
              value={activeProvider}
              onChange={(e) => setParams({ provider: e.target.value })}
              aria-label="Filter by provider"
            >
              <option value="">All providers</option>
              {providers.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
            <select
              className="field"
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
              aria-label="Sort models"
              disabled={Boolean(search)}
              title={search ? 'Results are ordered by search relevance' : undefined}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.map(({ tag, description }) => (
              <button
                key={tag}
                className="btn btn--chip"
                onClick={() => toggleTag(tag)}
                title={description}
                aria-pressed={activeTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn--chip"
              onClick={() => setParams({ open: !showOpenOnly })}
              aria-pressed={showOpenOnly}
              title="Models whose weights you can download and run yourself"
            >
              Open weights only
            </button>
            <button
              className="btn btn--chip"
              onClick={() => setParams({ retired: !includeLegacy })}
              aria-pressed={includeLegacy}
              title="Models that were real and widely used but can no longer be called"
            >
              Include retired models
            </button>
            {hasFilters && (
              <button className="btn btn--chip" onClick={clearAll}>
                Clear all
              </button>
            )}
            {(hasFilters || sort !== 'newest') && <ShareButton label="Share this view" />}
            <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {filtered.length} of {pool.length} shown
              {plainEnglish ? ' · plain English on' : ''}
            </span>
          </div>
        </div>

        <div className="model-grid">
          {filtered.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
            <p className="mono">No models match those filters.</p>
            <button className="btn" onClick={clearAll} style={{ marginTop: 'var(--space-4)' }}>
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
