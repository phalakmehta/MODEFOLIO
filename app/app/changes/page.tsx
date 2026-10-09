import type { Metadata } from 'next';
import ChangeList from '@/components/ChangeList';
import { changes, isImprovement } from '@/lib/changes';

export const metadata: Metadata = {
  title: 'What Changed — Modelfolio',
  description: 'Every AI model price cut, price rise, context window change and new model, logged weekly from the OpenRouter API.',
};

export default function ChangesPage() {
  const prices = changes.filter((c) => c.type === 'price-change');
  const cuts = prices.filter((c) => isImprovement(c)).length;
  const rises = prices.length - cuts;

  return (
    <div className="page-container" style={{ paddingBottom: 'var(--space-10)' }}>
      <section className="hero">
        <h1>What changed</h1>
        <p className="hero-subtitle">
          Every Monday the pipeline re-reads every model&rsquo;s price and limits from the OpenRouter
          API. Anything that moved since the week before is logged here, automatically.
        </p>
      </section>

      {changes.length === 0 ? (
        <p className="mono" style={{ color: 'var(--text-tertiary)' }}>
          Nothing logged yet. The first changes appear after the next weekly update.
        </p>
      ) : (
        <>
          {prices.length > 0 && (
            <p className="mono" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
              {cuts} price {cuts === 1 ? 'cut' : 'cuts'} and {rises} price {rises === 1 ? 'rise' : 'rises'} logged so far.
            </p>
          )}
          <ChangeList changes={changes} />
        </>
      )}
    </div>
  );
}
