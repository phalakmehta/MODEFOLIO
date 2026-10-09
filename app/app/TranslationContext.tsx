'use client';

import React, { createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from 'react';

type TranslateKind = 'context' | 'pricing' | 'arch' | 'benchmark' | 'maxOutput';

interface TranslationContextType {
  plainEnglish: boolean;
  togglePlainEnglish: () => void;
  /** Full sentence, for tables and body copy. */
  translate: (kind: TranslateKind, value: number | string) => string;
  /** Two or three words, for the tight space on a card badge. */
  shortLabel: (kind: TranslateKind, value: number | string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const STORAGE_KEY = 'modelfolio:plain-english';

/**
 * The toggle is one of the headline features, and it used to live only in
 * component state, so it reset on every navigation.
 *
 * localStorage is an external store, so it is read through useSyncExternalStore
 * rather than an effect: that gives a correct server snapshot (always false, which
 * matches the server-rendered HTML) and then the real value on the client, with no
 * hydration mismatch and no cascading render.
 */
const store = {
  listeners: new Set<() => void>(),

  subscribe(listener: () => void) {
    store.listeners.add(listener);
    // Keep tabs in sync with each other.
    window.addEventListener('storage', listener);
    return () => {
      store.listeners.delete(listener);
      window.removeEventListener('storage', listener);
    };
  },

  getSnapshot(): boolean {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      // Private mode, or site data blocked. The default is fine.
      return false;
    }
  },

  /** The server has no storage, so it renders the default. */
  getServerSnapshot(): boolean {
    return false;
  },

  set(value: boolean) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // Not worth surfacing; the toggle still works for this session.
    }
    store.listeners.forEach((l) => l());
  },
};

/**
 * Price bands, most expensive first. `short` exists because the card badge used
 * to be built with `translate('pricing', x).split(' ')[0]`, which rendered both
 * "Very Expensive" and "Very Cheap" as the single word "Very" — so the priciest
 * and nearly-cheapest models looked identical.
 */
const PRICE_BANDS = [
  { min: 15, short: 'Premium', long: 'Very expensive — reserve it for your hardest problems' },
  { min: 5, short: 'Pricey', long: 'Expensive — worth it when quality really matters' },
  { min: 1, short: 'Mid', long: 'Moderate — fine for everyday work' },
  { min: 0.1, short: 'Cheap', long: 'Cheap — comfortable for high-volume pipelines' },
  { min: 0, short: 'Budget', long: 'Barely costs anything — use it freely' },
];

function priceBand(price: number) {
  return PRICE_BANDS.find((b) => price >= b.min) ?? PRICE_BANDS[PRICE_BANDS.length - 1];
}

/** Roughly 0.75 words per token, rounded to something a person can picture. */
function tokensAsWords(tokens: number): string {
  const words = Math.round(tokens * 0.75);
  if (words >= 1_000_000) return `${(words / 1_000_000).toFixed(1)} million words`;
  if (words >= 1_000) return `${Math.round(words / 1_000).toLocaleString()},000 words`;
  return `${words.toLocaleString()} words`;
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const plainEnglish = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const togglePlainEnglish = useCallback(() => {
    store.set(!store.getSnapshot());
  }, []);

  const translate = useCallback(
    (kind: TranslateKind, value: number | string) => {
      if (!plainEnglish) return String(value);

      switch (kind) {
        case 'context': {
          const ctx = Number(value);
          if (ctx >= 1_000_000) return `Reads about ${tokensAsWords(ctx)} at once — a whole codebase, or several books`;
          if (ctx >= 200_000) return `Reads about ${tokensAsWords(ctx)} at once — a long book or a medium codebase`;
          if (ctx >= 100_000) return `Reads about ${tokensAsWords(ctx)} at once — a novel, or a stack of long documents`;
          if (ctx >= 32_000) return `Reads about ${tokensAsWords(ctx)} at once — a long paper, or 20 to 30 code files`;
          return `Reads about ${tokensAsWords(ctx)} at once — a few articles or short files`;
        }
        case 'maxOutput': {
          // Previously hardcoded to "~2,000 to 4,000 words" for every model,
          // which was wrong by a factor of thirty on a 128K output limit.
          const tokens = Number(value);
          if (!tokens) return 'The provider has not published an output limit';
          return `Writes up to about ${tokensAsWords(tokens)} in a single reply`;
        }
        case 'pricing':
          return priceBand(Number(value)).long;
        case 'arch':
          return value === 'mixture-of-experts'
            ? 'A team of specialists — only the relevant part runs, so it is fast for its size'
            : value === 'dense'
              ? 'One big generalist — steady and consistent, but it uses more power per word'
              : 'The provider has not said how this one is built';
        case 'benchmark': {
          const score = Number(value);
          if (score >= 90) return 'Tops standardised tests — which does not guarantee it handles your work';
          if (score >= 80) return 'Solid baseline knowledge';
          return 'Struggles with advanced academic questions';
        }
        default:
          return String(value);
      }
    },
    [plainEnglish],
  );

  const shortLabel = useCallback((kind: TranslateKind, value: number | string) => {
    switch (kind) {
      case 'pricing':
        return priceBand(Number(value)).short;
      case 'arch':
        return value === 'mixture-of-experts' ? 'Specialists' : value === 'dense' ? 'Generalist' : 'Undisclosed';
      default:
        return String(value);
    }
  }, []);

  return (
    <TranslationContext.Provider value={{ plainEnglish, togglePlainEnglish, translate, shortLabel }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
