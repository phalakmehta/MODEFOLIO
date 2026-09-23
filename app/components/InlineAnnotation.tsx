'use client';

import { useState, ReactNode } from 'react';
import concepts from '@/data/concepts.json';

interface InlineAnnotationProps {
  term: string;
  children?: ReactNode;
}

export default function InlineAnnotation({ term, children }: InlineAnnotationProps) {
  const [open, setOpen] = useState(false);

  const concept = concepts.find(
    (c) => c.term.toLowerCase() === term.toLowerCase() ||
           c.slug === term.toLowerCase().replace(/\s+/g, '-')
  );

  if (!concept) {
    return <span>{children || term}</span>;
  }

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        className="annotation-trigger"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(!open); }}
        aria-expanded={open}
      >
        {children || term}
      </span>
      <span className={`annotation-panel ${open ? 'open' : ''}`} style={{ display: 'block' }}>
        <span className="annotation-content">
          <strong>{concept.term}</strong>
          <p>{concept.definition}</p>
          <p className="annotation-consequence">{concept.realWorldConsequence}</p>
        </span>
      </span>
    </span>
  );
}

export function annotateText(text: string): ReactNode[] {
  const sortedConcepts = [...concepts].sort((a, b) => b.term.length - a.term.length);
  const result: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    let earliestMatch: { index: number; concept: typeof concepts[0] } | null = null;

    for (const concept of sortedConcepts) {
      const idx = remaining.toLowerCase().indexOf(concept.term.toLowerCase());
      if (idx !== -1 && (earliestMatch === null || idx < earliestMatch.index)) {
        earliestMatch = { index: idx, concept };
      }
    }

    if (earliestMatch) {
      if (earliestMatch.index > 0) {
        result.push(remaining.slice(0, earliestMatch.index));
      }
      const matchedText = remaining.slice(
        earliestMatch.index,
        earliestMatch.index + earliestMatch.concept.term.length
      );
      result.push(
        <InlineAnnotation key={keyIdx++} term={earliestMatch.concept.term}>
          {matchedText}
        </InlineAnnotation>
      );
      remaining = remaining.slice(earliestMatch.index + earliestMatch.concept.term.length);
    } else {
      result.push(remaining);
      break;
    }
  }

  return result;
}
