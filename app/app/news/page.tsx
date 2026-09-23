import NewsSection from '@/components/NewsSection';

export const metadata = {
  title: 'Weekly AI News Digest — Modelfolio',
  description: 'Catch up on the latest AI model news, releases, and updates.',
};

export default function NewsPage() {
  return (
    <div className="page-container" style={{ paddingTop: 'var(--space-8)' }}>
      <NewsSection />
    </div>
  );
}
