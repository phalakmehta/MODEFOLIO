'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Page state that lives in the URL, so a filtered directory, a comparison or a
 * set of Wizard answers can be bookmarked and shared.
 *
 * Built on useSyncExternalStore rather than useSearchParams: the server snapshot
 * is an empty query, so statically generated pages still prerender in full and
 * pick up the real query on hydration, with no Suspense boundary needed.
 */

const EVENT = 'modelfolio:querychange';

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => '';

/** Commas are safe in a query string; leaving them unescaped keeps shared links readable. */
function serialize(params: URLSearchParams): string {
  return Array.from(params.entries())
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v).replace(/%2C/gi, ',')}`)
    .join('&');
}

export type QueryUpdate = Record<string, string | string[] | boolean | null | undefined>;

export function useQueryParams() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const params = useMemo(() => new URLSearchParams(search), [search]);

  /** Merge changes into the query. Empty values (null, '', [], false) remove the key. */
  const update = useCallback((changes: QueryUpdate) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      const str = Array.isArray(value) ? value.join(',') : value === true ? '1' : value || '';
      if (str) next.set(key, str);
      else next.delete(key);
    }
    const qs = serialize(next);
    // replaceState, not pushState: typing in a search box should not fill the
    // back button with one entry per keystroke.
    window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [params, update] as const;
}

export const listParam = (params: URLSearchParams, key: string): string[] =>
  (params.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
