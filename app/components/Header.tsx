'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import BsToggle from './BsToggle';

const NAV_ITEMS = [
  { href: '/', label: 'Directory' },
  { href: '/news', label: 'News' },
  { href: '/changes', label: 'Changes' },
  { href: '/compare', label: 'Compare' },
  { href: '/wizard', label: 'Wizard' },
  { href: '/glossary', label: 'Glossary' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // The overlay is position: fixed, so without this the page underneath still
  // scrolls while the menu is open.
  useEffect(() => {
    document.body.classList.toggle('nav-open', mobileOpen);
    return () => document.body.classList.remove('nav-open');
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="site-logo">
          Modelfolio
        </Link>

        <nav className={`site-nav ${mobileOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <BsToggle />
        </nav>

        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileOpen}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
