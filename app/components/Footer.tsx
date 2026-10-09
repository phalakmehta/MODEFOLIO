import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-text">
          Modelfolio — Prices and limits refreshed every Monday from the OpenRouter API. Not affiliated with any model provider.
        </p>
        <ul className="footer-links">
          <li><a href="https://github.com/phalakmehta/MODEFOLIO" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><Link href="/changes">What changed</Link></li>
          <li><Link href="/glossary">Glossary</Link></li>
        </ul>
      </div>
    </footer>
  );
}
