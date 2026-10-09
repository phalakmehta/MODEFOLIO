'use client';

import { useState } from 'react';

/** Copies the current URL, which carries the page state (filters, comparison, Wizard answers). */
export default function ShareButton({ label = 'Copy link' }: { label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure origin, permissions). The URL
      // bar still has the link, so there is nothing useful to show.
    }
  };

  return (
    <button className="btn share-btn" onClick={copy} aria-live="polite">
      {copied ? 'Link copied ✓' : label}
    </button>
  );
}
