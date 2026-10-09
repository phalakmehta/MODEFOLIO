'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  const [activeStep, setActiveStep] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveStep(Number(entry.target.getAttribute('data-step')));
        });
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    document.querySelectorAll('.scrolly-step').forEach((step) => observerRef.current?.observe(step));
    return () => observerRef.current?.disconnect();
  }, []);

  // Pulled from the data rather than written into the copy, so the essay cannot
  // go stale the way the old hardcoded figures did.
  const cheapest = useMemo(() => [...liveModels].sort((a, b) => blendedPrice(a) - blendedPrice(b))[0], []);
  const dearest = useMemo(() => [...liveModels].sort((a, b) => blendedPrice(b) - blendedPrice(a))[0], []);
  const widest = useMemo(
    () => [...liveModels].sort((a, b) => b.specs.contextWindow - a.specs.contextWindow)[0],
    [],
  );

  const getChartContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-massive)', color: 'var(--accent)', lineHeight: 1 }}>
              {liveModels.filter((m) => m.benchmarks.length === 0).length}
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)' }}>
              of {liveModels.length} models have no benchmark score we can source.
            </p>
          </div>
        );
      case 1:
        return (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: 400 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '12px',
                    background: i < 2 ? 'var(--accent)' : 'var(--text-tertiary)',
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
            <p className="mono" style={{ marginTop: 'var(--space-4)', color: 'var(--accent)' }}>
              8K tokens vs {(widest.specs.contextWindow / 1000).toFixed(0)}K tokens
            </p>
          </div>
        );
      case 2:
        return (
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-6xl)', color: 'var(--text-primary)' }}>
              ${blendedPrice(cheapest).toFixed(2)}{' '}
              <span style={{ color: 'var(--text-tertiary)' }}>vs</span> ${blendedPrice(dearest).toFixed(2)}
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)' }}>
              For the exact same million tokens.
            </p>
          </div>
        );
      default:
        return <div>Keep scrolling...</div>;
    }
  };

  const filterButton = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--text-primary)' : 'transparent',
    color: active ? 'var(--bg-primary)' : 'inherit',
    fontSize: 'var(--text-xs)',
    padding: '4px 10px',
  });

  return (
    <div className="page-container">
      <header className="essay-header">
        <h1 className="essay-title">Why you&rsquo;re choosing the wrong AI model.</h1>
        <p className="essay-deck drop-cap">
          Every week a new model drops, and every week it claims to beat the last one.
          The benchmarks are saturated, the jargon is impenetrable, and the marketing is
          built to make comparison hard. Let&rsquo;s cut the bullshit.
        </p>
      </header>

      <section className="scrolly-container">
        <div className="scrolly-text">
          <div className={`scrolly-step ${activeStep === 0 ? 'is-active' : ''}`} data-step="0">
            <h2>The Benchmark Illusion</h2>
            <p>
              Release notes love a benchmark score. MMLU is a big general-knowledge exam;
              HumanEval is a coding test. Almost every serious model now scores highly on both.
            </p>
            <p>
              When every model passes the bar exam, the bar exam stops telling you who is a
              good lawyer. And most scores you see are self-reported by the company selling
              the model, measured under its own conditions. We only publish a score when we
              can tell you exactly where it came from — which is why most models here show
              none at all.
            </p>
          </div>

          <div className={`scrolly-step ${activeStep === 1 ? 'is-active' : ''}`} data-step="1">
            <h2>The Context Window Arms Race</h2>
            <p>
              A &ldquo;token&rdquo; is roughly three-quarters of a word. The context window is
              how much the model can read at once. Eight thousand tokens was the standard not
              long ago — enough for a short essay. The widest window in this directory today
              belongs to {displayName(widest.name)}, at{' '}
              {(widest.specs.contextWindow / 1_000_000).toFixed(2).replace(/\.?0+$/, '')} million
              tokens.
            </p>
            <p>
              That is a whole codebase in a single request. But a model that <em>can</em> hold
              a million tokens does not necessarily pay attention to all of them. Most still
              suffer from &ldquo;lost in the middle&rdquo;: information buried in the centre of
              a huge prompt quietly gets ignored.
            </p>
          </div>

          <div className={`scrolly-step ${activeStep === 2 ? 'is-active' : ''}`} data-step="2">
            <h2>The True Cost Matrix</h2>
            <p>
              Open weights are not free — running them costs compute. And API pricing varies by
              more than a factor of{' '}
              {Math.round(blendedPrice(dearest) / Math.max(blendedPrice(cheapest), 0.001))}{' '}
              across the models on this page, for the same million tokens.
            </p>
            <p>
              Using a frontier model to classify support tickets is hiring a senior engineer to
              sort the post. The trick is not picking the best model; it is routing each task to
              the cheapest model that will not fail at it.
            </p>
          </div>
        </div>

        <div>
          <div className="scrolly-sticky">
            <div className="scrolly-chart">{getChartContent()}</div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 'var(--space-10)', paddingBottom: 'var(--space-11)' }}>
        <div style={{ marginBottom: 'var(--space-5)' }}>
          <div
            className="mono"
            style={{
              color: 'var(--accent)',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}
          >
            The Model Map
          </div>
          <h2 style={{ fontSize: 'var(--text-4xl)' }}>Explore the ecosystem.</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            {liveModels.length} models you can call today, from {providers.length} providers.
            Specs come straight from the OpenRouter API — we never type a price by hand.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`Search ${pool.length} models...`}
              value={search}
              onChange={(e) => setParams({ q: e.target.value })}
              aria-label="Search models"
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                flex: '1 1 220px',
                minWidth: 0,
              }}
            />
            <select
              value={activeProvider}
              onChange={(e) => setParams({ provider: e.target.value })}
              aria-label="Filter by provider"
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
              }}
            >
              <option value="">All providers</option>
              {providers.map(([name, count]) => (
                <option key={name} value={name}>
                  {name} ({count})
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value === 'newest' ? null : e.target.value })}
              aria-label="Sort models"
              disabled={Boolean(search)}
              title={search ? 'Results are ordered by search relevance' : undefined}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
              }}
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
                className="btn"
                onClick={() => toggleTag(tag)}
                style={filterButton(activeTags.includes(tag))}
                title={description}
                aria-pressed={activeTags.includes(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn"
              onClick={() => setParams({ open: !showOpenOnly })}
              style={filterButton(showOpenOnly)}
              aria-pressed={showOpenOnly}
              title="Models whose weights you can download and run yourself"
            >
              Open weights only
            </button>
            <button
              className="btn"
              onClick={() => setParams({ retired: !includeLegacy })}
              style={filterButton(includeLegacy)}
              aria-pressed={includeLegacy}
              title="Models that were real and widely used but can no longer be called"
            >
              Include retired models
            </button>
            {hasFilters && (
              <button className="btn" onClick={clearAll} style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }}>
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
