import type { Metadata } from 'next';
import concepts from '@/data/concepts.json';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata: Metadata = {
  title: 'AI Glossary — Modelfolio',
  description: 'Plain-language definitions of AI and machine learning terms: context windows, tokens, benchmarks, MoE, RLHF, and more.',
};

function groupByLetter(items: typeof concepts) {
  const groups: Record<string, typeof concepts> = {};
  for (const item of items) {
    const letter = item.term[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function GlossaryPage() {
  const grouped = groupByLetter(concepts);
  const letters = grouped.map(([letter]) => letter);

  return (
    <div className="page-container">
      <div className="content-width">
        <section className="hero">
          <h1>AI Glossary</h1>
          <p className="hero-subtitle">
            Every technical term used on this site, explained in plain language with
            real-world consequences you can actually act on.
          </p>
        </section>

        <nav className="glossary-nav">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`}>
              {letter}
            </a>
          ))}
        </nav>

        {grouped.map(([letter, terms]) => (
          <div key={letter}>
            <h2 className="glossary-letter" id={`letter-${letter}`}>
              {letter}
            </h2>
            {terms.map((concept) => (
              <ScrollReveal key={concept.slug}>
                <div className="glossary-entry" id={`term-${concept.slug}`}>
                  <h3 className="glossary-term">{concept.term}</h3>
                  <p className="glossary-definition">{concept.definition}</p>
                  <p className="glossary-consequence">{concept.realWorldConsequence}</p>
                  {concept.relatedTerms.length > 0 && (
                    <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                      <span className="small-caps" style={{ marginRight: 'var(--space-1)' }}>Related:</span>
                      {concept.relatedTerms.map((slug) => {
                        const related = concepts.find((c) => c.slug === slug);
                        return related ? (
                          <a key={slug} href={`#term-${slug}`} className="badge" style={{ textDecoration: 'none' }}>
                            {related.term}
                          </a>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
