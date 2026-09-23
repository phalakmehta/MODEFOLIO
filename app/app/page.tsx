'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import models from '@/data/models.json';
import ModelCard from '@/components/ModelCard';
import ScrollReveal from '@/components/ScrollReveal';
import NewsSection from '@/components/NewsSection';
import { useTranslation } from '@/app/TranslationContext';

export default function HomePage() {
  const { plainEnglish, translate } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Filter state for the directory
  const [search, setSearch] = useState('');
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  const fuse = useMemo(() => new Fuse(models, { keys: ['name', 'provider', 'tags'], threshold: 0.3 }), []);
  
  const filtered = useMemo(() => {
    let result = search ? fuse.search(search).map(r => r.item) : [...models];
    if (showOpenOnly) result = result.filter(m => m.openSource);
    return result;
  }, [search, showOpenOnly, fuse]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveStep(Number(entry.target.getAttribute('data-step')));
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px' });

    document.querySelectorAll('.scrolly-step').forEach(step => observerRef.current?.observe(step));
    return () => observerRef.current?.disconnect();
  }, []);

  const getChartContent = () => {
    switch(activeStep) {
      case 0:
        return (
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-massive)', color: 'var(--accent)', lineHeight: 1 }}>90%</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)' }}>The new average.</p>
          </div>
        );
      case 1:
        return (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: 400 }).map((_, i) => (
                <div key={i} style={{ width: '8px', height: '12px', background: i < 5 ? 'var(--accent)' : 'var(--text-tertiary)', opacity: 0.5 }} />
              ))}
            </div>
            <p className="mono" style={{ marginTop: 'var(--space-4)', color: 'var(--accent)' }}>4K tokens vs 400K tokens</p>
          </div>
        );
      case 2:
        return (
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: 'var(--text-6xl)', color: 'var(--text-primary)' }}>$0.02 <span style={{color: 'var(--text-tertiary)'}}>vs</span> $15.00</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)' }}>For the exact same output length.</p>
          </div>
        );
      default:
        return <div>Keep scrolling...</div>;
    }
  };

  return (
    <div className="page-container">
      <header className="essay-header">
        <h1 className="essay-title">Why you&rsquo;re choosing the wrong AI model.</h1>
        <p className="essay-deck drop-cap">
          Every week, a new model drops. Every week, it claims to beat GPT-4.
          The benchmarks are saturated, the technical jargon is impenetrable, and the marketing
          is intentionally misleading. Let&rsquo;s cut the bullshit.
        </p>
      </header>

      {/* Scrollytelling Section */}
      <section className="scrolly-container">
        <div className="scrolly-text">
          <div className={`scrolly-step ${activeStep === 0 ? 'is-active' : ''}`} data-step="0">
            <h2>The Benchmark Illusion</h2>
            <p>
              Look at the release notes of any model today, and you&rsquo;ll see it scores above 85% on MMLU (a massive test of academic knowledge) and HumanEval (a coding test).
            </p>
            <p>
              When every model passes the bar exam, the bar exam stops being a useful metric for finding a good lawyer. 
              High benchmark scores just mean the model has basic competence. They tell you nothing about whether it can 
              navigate a messy legacy codebase, follow complex formatting instructions, or reason through ambiguous edge cases without hallucinating.
            </p>
          </div>

          <div className={`scrolly-step ${activeStep === 1 ? 'is-active' : ''}`} data-step="1">
            <h2>The Context Window Arms Race</h2>
            <p>
              A "token" is roughly three-quarters of a word. A 4K context window (the old standard) could hold a short essay. 
              Today&rsquo;s models, like Gemini 1.5 Pro, boast a 2 Million token window.
            </p>
            <p>
              That means you can upload the entire Harry Potter series, twice, and ask a question about it. 
              But here&rsquo;s the catch: just because a model can *hold* 2 million tokens doesn't mean it pays attention to all of them. 
              Many models suffer from "lost in the middle" syndrome, completely forgetting information buried in large prompts.
            </p>
          </div>

          <div className={`scrolly-step ${activeStep === 2 ? 'is-active' : ''}`} data-step="2">
            <h2>The True Cost Matrix</h2>
            <p>
              Open source isn't free—it costs compute to run. And API pricing varies wildly.
              You can pay $15 to process a million tokens with a flagship model, or you can pay $0.02 to process it with a fast, specialized routing model.
            </p>
            <p>
              Using a massive, dense model for simple classification tasks is like hiring a senior engineer to sort your mail. 
              The secret to building good AI features isn't picking the best model; it's routing the task to the cheapest model that won't fail.
            </p>
          </div>
        </div>

        <div>
          <div className="scrolly-sticky">
            <div className="scrolly-chart">
              {getChartContent()}
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <NewsSection />

      {/* Interactive Directory Section */}
      <section style={{ marginTop: 'var(--space-10)', paddingBottom: 'var(--space-11)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
          <div>
            <div className="mono" style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>The Model Map</div>
            <h2 style={{ fontSize: 'var(--text-4xl)' }}>Explore the ecosystem.</h2>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="Search 35+ models..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
                width: '250px'
              }}
            />
            <button 
              className="btn" 
              onClick={() => setShowOpenOnly(!showOpenOnly)}
              style={{ background: showOpenOnly ? 'var(--text-primary)' : 'transparent', color: showOpenOnly ? 'var(--bg-primary)' : 'inherit' }}
            >
              Open Source Only
            </button>
          </div>
        </div>

        <div className="model-grid">
          {filtered.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div style={{ padding: 'var(--space-8) 0', textAlign: 'center' }}>
            <p className="mono">No models match your search.</p>
          </div>
        )}
      </section>
    </div>
  );
}
