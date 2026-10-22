'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { liveModels, displayName, formatTokens } from '@/lib/data';
import { changes } from '@/lib/changes';

// Sub-cent prices need more than two decimals to stay honest.
const money = (n: number | null | undefined) =>
  n == null ? '—' : `$${n < 0.1 ? n.toFixed(4).replace(/0+$/, '') : n.toFixed(2)}`;

const monthName = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

const median = (xs: number[]) => {
  const v = [...xs].sort((a, b) => a - b);
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
};

/**
 * The argument behind the directory. Every figure here is computed from
 * models.json and changelog.json at render time, so the essay cannot drift
 * away from the data it is describing.
 */
export default function WhyPage() {
  const [activeStep, setActiveStep] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  // 1. Output tokens cost a multiple of input tokens, on nearly every model.
  const priceAsymmetry = useMemo(() => {
    const priced = liveModels.filter((m) => m.specs.pricing.input > 0);
    const ratios = priced.map((m) => m.specs.pricing.output / m.specs.pricing.input);
    const worst = priced.reduce((a, b) =>
      b.specs.pricing.output / b.specs.pricing.input > a.specs.pricing.output / a.specs.pricing.input ? b : a,
    );
    return {
      median: median(ratios),
      heavy: ratios.filter((r) => r >= 4).length,
      total: priced.length,
      worst,
      worstRatio: worst.specs.pricing.output / worst.specs.pricing.input,
    };
  }, []);

  // 2. A huge context window says nothing about how much you can get back out.
  const outputCeiling = useMemo(() => {
    const withCap = liveModels.filter((m) => m.specs.maxOutputTokens);
    const huge = withCap.filter((m) => m.specs.contextWindow >= 1_000_000);
    const tightest = huge.reduce((a, b) =>
      (b.specs.maxOutputTokens ?? 0) < (a.specs.maxOutputTokens ?? 0) ? b : a,
    );
    return {
      huge: huge.length,
      tightest,
      medianRatio: median(withCap.map((m) => m.specs.contextWindow / (m.specs.maxOutputTokens ?? 1))),
    };
  }, []);

  // 3. The logged price moves, which do not all point downwards.
  const priceMoves = useMemo(() => {
    const priced = changes.filter((c) => c.type === 'price-change' && c.old != null && c.new != null);
    const pct = (c: (typeof priced)[number]) => ((c.new as number) - (c.old as number)) / (c.old as number);
    const up = priced.filter((c) => pct(c) > 0);
    const biggest = up.length ? up.reduce((a, b) => (pct(b) > pct(a) ? b : a)) : null;
    return {
      total: priced.length,
      up: up.length,
      down: priced.length - up.length,
      biggest,
      biggestPct: biggest ? Math.round(pct(biggest) * 100) : 0,
      biggestModel: biggest ? liveModels.find((m) => m.id === biggest.modelId) : undefined,
    };
  }, []);

  const unsourced = liveModels.filter((m) => m.benchmarks.length === 0).length;

  const getChartContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-massive)', lineHeight: 1 }}>
              {priceAsymmetry.median.toFixed(0)}&times;
            </div>
            <p style={{ fontSize: 'var(--text-lg)' }}>
              The median model charges {priceAsymmetry.median.toFixed(0)} times more for a token it
              writes than one it reads.
            </p>
          </div>
        );
      case 1:
        return (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <div className="ratio-bar">
              <div className="ratio-bar-fill" style={{ width: '100%' }} />
            </div>
            <p className="mono" style={{ margin: 'var(--space-2) 0 var(--space-5)' }}>
              {formatTokens(outputCeiling.tightest.specs.contextWindow)} in
            </p>
            <div className="ratio-bar">
              <div
                className="ratio-bar-fill ratio-bar-fill--small"
                style={{
                  width: `${Math.max(
                    ((outputCeiling.tightest.specs.maxOutputTokens ?? 0) /
                      outputCeiling.tightest.specs.contextWindow) *
                      100,
                    0.4,
                  )}%`,
                }}
              />
            </div>
            <p className="mono" style={{ marginTop: 'var(--space-2)' }}>
              {formatTokens(outputCeiling.tightest.specs.maxOutputTokens)} out
            </p>
          </div>
        );
      case 2:
        return (
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-6xl)', lineHeight: 1 }}>
              <span style={{ color: 'var(--bad)' }}>&#9650; {priceMoves.up}</span>{' '}
              <span style={{ color: 'var(--text-tertiary)' }}>/</span>{' '}
              <span style={{ color: 'var(--good)' }}>&#9660; {priceMoves.down}</span>
            </div>
            <p style={{ fontSize: 'var(--text-lg)' }}>
              Of the {priceMoves.total} price changes we have logged, {priceMoves.up} were rises.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <header className="essay-header">
        <Link href="/" className="small-caps back-link">
          ← Back to the directory
        </Link>
        <h1 className="essay-title">Three things the spec sheets don&rsquo;t tell you.</h1>
        <p className="essay-deck">
          Everyone knows benchmarks are saturated and context windows are marketing. Less discussed
          is what we found actually running the numbers across all {liveModels.length} models in
          this directory, every Monday, for months.
        </p>
      </header>

      <section className="scrolly-container">
        <div className="scrolly-text">
          <div className={`scrolly-step ${activeStep === 0 ? 'is-active' : ''}`} data-step="0">
            <h2>You are probably optimising the wrong half of the bill</h2>
            <p>
              Prompt engineering advice obsesses over the prompt. But on{' '}
              {priceAsymmetry.heavy} of the {priceAsymmetry.total} priced models here, an output
              token costs at least <strong>four times</strong> what an input token costs. The median
              multiple is {priceAsymmetry.median.toFixed(0)}×. On{' '}
              {displayName(priceAsymmetry.worst.name)} it reaches{' '}
              {priceAsymmetry.worstRatio.toFixed(0)}×.
            </p>
            <p>
              That inverts the usual advice. Trimming a thousand tokens off a system prompt saves
              you a fraction of what capping the response length does. If your costs are running
              hot, the first question is not &ldquo;how long is my prompt&rdquo; — it is{' '}
              &ldquo;how long are the answers, and did I ever set a limit?&rdquo;
            </p>
            <p>
              It also quietly reprices entire use cases. Summarisation reads a lot and writes a
              little, so it is cheap almost everywhere. Code generation and long-form drafting read
              a little and write a lot, so they land on the expensive side of a{' '}
              {priceAsymmetry.median.toFixed(0)}× multiplier every single call.
            </p>
          </div>

          <div className={`scrolly-step ${activeStep === 1 ? 'is-active' : ''}`} data-step="1">
            <h2>A million tokens in does not mean a million tokens out</h2>
            <p>
              {outputCeiling.huge} models in this directory advertise a context window of a million
              tokens or more. The number quoted in the launch post is almost always the{' '}
              <em>input</em> limit. Each one also has a separate, far smaller ceiling on how much it
              can produce in a single response — and that one rarely makes the headline.
            </p>
            <p>
              {displayName(outputCeiling.tightest.name)} will read{' '}
              {formatTokens(outputCeiling.tightest.specs.contextWindow)} and write back at most{' '}
              {formatTokens(outputCeiling.tightest.specs.maxOutputTokens)}. Across every model here
              that publishes both figures, the context window is a median of{' '}
              {outputCeiling.medianRatio.toFixed(0)}× the output ceiling.
            </p>
            <p>
              This is the constraint that actually breaks architectures. Feeding a model your whole
              repository works fine. Asking it to give the whole repository back, refactored, does
              not — and you discover this after you have built around the big number, not before.
              Translation, bulk rewriting and file-by-file migration all hit this wall first.
            </p>
          </div>

          <div className={`scrolly-step ${activeStep === 2 ? 'is-active' : ''}`} data-step="2">
            <h2>Inference prices go up, too</h2>
            <p>
              The industry story is that costs fall forever. Our own changelog disagrees. Of the{' '}
              {priceMoves.total} price changes we have recorded since we started logging them,{' '}
              <strong>{priceMoves.up} were increases</strong> and only {priceMoves.down} were cuts.
            </p>
            {priceMoves.biggest && (
              <p>
                The largest was {priceMoves.biggestModel ? displayName(priceMoves.biggestModel.name) : priceMoves.biggest.modelId}
                , which went from {money(priceMoves.biggest.old)} to {money(priceMoves.biggest.new)} per
                million tokens in {monthName(priceMoves.biggest.date)} — a rise of{' '}
                {priceMoves.biggestPct}% overnight, with no change to the model itself.
              </p>
            )}
            <p>
              Headline frontier pricing does keep falling. What moves the other way is the cheap
              end: introductory rates that get corrected once the traffic arrives. If you picked a
              model because it was nearly free and built a margin on top of that number, the margin
              is the thing at risk. This is the entire reason we log every change and date it.
            </p>
          </div>
        </div>

        <div>
          <div className="scrolly-sticky">
            <div className="scrolly-chart">{getChartContent()}</div>
          </div>
        </div>
      </section>

      <section className="essay-outro">
        <h2>Which is also why we show you so little.</h2>
        <p>
          {unsourced} of our {liveModels.length} models carry no benchmark score at all. Not because
          none has been published, but because we could not trace one to a source we could point
          you at. We would rather show a blank than a number the vendor marked its own homework on.
        </p>
        <Link href="/" className="btn">
          Browse the directory
        </Link>
      </section>
    </div>
  );
}
