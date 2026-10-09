'use client';

import Link from 'next/link';
import newsDigest from '@/data/news.json';
import { getModelById, displayName } from '@/lib/data';

type Item = {
  headline: string;
  summary: string;
  whyItMatters?: string;
  modelIds: string[];
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
};

const digest = newsDigest as { weekOf: string; generatedAt: string; model: string; items: Item[] };

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function weeksSince(iso: string): number | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export default function NewsSection() {
  const items = digest?.items ?? [];

  // Previously returned null, which rendered /news as a completely blank page.
  if (items.length === 0) {
    return (
      <section style={{ marginTop: 'var(--space-10)' }}>
        <h2 style={{ fontSize: 'var(--text-4xl)' }}>No digest yet.</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-3)' }}>
          The weekly digest is assembled by an automated pipeline that only publishes
          stories it can trace to a real source. If it could not find at least three
          this week, it writes nothing rather than padding the list.
        </p>
        <Link href="/" className="btn" style={{ marginTop: 'var(--space-5)' }}>
          Browse the directory instead →
        </Link>
      </section>
    );
  }

  const age = weeksSince(digest.generatedAt);

  return (
    <section style={{ marginTop: 'var(--space-10)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
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
          The Weekly Digest
        </div>
        <h2 style={{ fontSize: 'var(--text-4xl)' }}>What you missed.</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Week of {digest.weekOf}, summarised by {digest.model} from stories it was shown —
          never from memory.
        </p>

        {/* Saying how old the digest is beats implying it is fresh. */}
        {age !== null && age >= 2 && (
          <p
            className="mono"
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-3)',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            This digest is about {age} weeks old. The pipeline that refreshes it runs weekly;
            if this stays stale, the run is failing.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {items.map((item, i) => {
          // These used to render as raw internal ids, e.g. "openai-gpt-6-luna-pro",
          // unlinked — on a site whose whole point is being readable by beginners.
          const linkedModels = item.modelIds
            .map((id) => getModelById(id))
            .filter((m): m is NonNullable<typeof m> => Boolean(m));

          return (
            <article
              key={i}
              style={{
                padding: 'var(--space-5)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md, 4px)',
              }}
            >
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>{item.headline}</h3>
              </a>

              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>{item.summary}</p>

              {/* Generated and stored all along, but never shown — and it is the one
                  field that actually answers "so should I care?" */}
              {item.whyItMatters && (
                <p
                  style={{
                    borderLeft: '3px solid var(--accent)',
                    paddingLeft: 'var(--space-4)',
                    marginBottom: 'var(--space-4)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'var(--text-lg)',
                  }}
                >
                  <strong
                    className="mono"
                    style={{ display: 'block', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--accent)' }}
                  >
                    Why it matters
                  </strong>
                  {item.whyItMatters}
                </p>
              )}

              <div
                className="mono"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {domainOf(item.sourceUrl)} ↗
                </a>
                {item.publishedAt && (
                  <>
                    <span>·</span>
                    <span>{item.publishedAt.slice(0, 10)}</span>
                  </>
                )}
              </div>

              {linkedModels.length > 0 && (
                <div
                  style={{
                    marginTop: 'var(--space-3)',
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    Affects:
                  </span>
                  {linkedModels.map((m) => (
                    <Link key={m.id} href={`/models/${m.id}`} className="badge" style={{ textDecoration: 'none' }}>
                      {displayName(m.name)}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
