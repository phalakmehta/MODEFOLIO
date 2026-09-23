'use client';

import newsDigest from '@/data/news.json';

export default function NewsSection() {
  if (!newsDigest || !newsDigest.items || newsDigest.items.length === 0) {
    return null;
  }

  return (
    <section style={{ marginTop: 'var(--space-10)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div className="mono" style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
          The Weekly Digest
        </div>
        <h2 style={{ fontSize: 'var(--text-4xl)' }}>What you missed this week.</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Curated by AI for the week of {newsDigest.weekOf}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {newsDigest.items.map((item: any, i: number) => {
          const domain = item.sourceUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
          
          return (
            <a 
              key={i} 
              href={item.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'block',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{ fontSize: '1.125rem', marginBottom: 'var(--space-2)' }}>{item.headline}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                {item.summary}
              </p>
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{domain}</span>
                {item.modelIds && item.modelIds.length > 0 && (
                  <>
                    <span>•</span>
                    <span style={{ color: 'var(--accent)' }}>{item.modelIds.join(', ')}</span>
                  </>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
