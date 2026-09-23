'use client';

import { useState } from 'react';
import Link from 'next/link';

interface WizardOption {
  value: string;
  label: string;
  description: string;
}

interface WizardStep {
  question: string;
  key: string;
  options: WizardOption[];
}

const STEPS: WizardStep[] = [
  {
    question: 'What will you mainly use the model for?',
    key: 'task',
    options: [
      { value: 'coding', label: 'Coding', description: 'Writing, reviewing, or debugging code' },
      { value: 'writing', label: 'Writing & Content', description: 'Articles, emails, creative writing, copywriting' },
      { value: 'research', label: 'Research & Analysis', description: 'Analyzing documents, answering complex questions' },
      { value: 'data', label: 'Data Processing', description: 'Extraction, classification, summarization at scale' },
      { value: 'chatbot', label: 'Chatbot / Assistant', description: 'User-facing conversational AI' },
      { value: 'general', label: 'General / Mixed', description: 'A bit of everything, no single focus' },
    ],
  },
  {
    question: 'How important is cost?',
    key: 'budget',
    options: [
      { value: 'unlimited', label: 'Quality first', description: 'I want the best results, cost doesn\'t matter' },
      { value: 'moderate', label: 'Balanced', description: 'Good quality at a reasonable price' },
      { value: 'cheap', label: 'As cheap as possible', description: 'Minimize cost, acceptable quality tradeoff' },
    ],
  },
  {
    question: 'How much text do you need to process at once?',
    key: 'context',
    options: [
      { value: 'short', label: 'Short', description: 'A few paragraphs or a page — typical chat messages' },
      { value: 'medium', label: 'Medium', description: 'Several pages — articles, code files, short documents' },
      { value: 'long', label: 'Very long', description: 'Entire books, large codebases, hundreds of pages' },
    ],
  },
  {
    question: 'How complex are the tasks?',
    key: 'complexity',
    options: [
      { value: 'simple', label: 'Simple', description: 'Straightforward Q&A, basic instructions' },
      { value: 'moderate', label: 'Moderate', description: 'Multi-step tasks, some reasoning needed' },
      { value: 'complex', label: 'Complex / Agentic', description: 'Deep reasoning, autonomous multi-step workflows, hard problems' },
    ],
  },
];

interface Answers {
  [key: string]: string;
}

interface Recommendation {
  modelId: string;
  rank: number;
  matchScore: number;
  reason: string;
  tradeoff: string;
  benchmarkNote: string | null;
  modelData: {
    name: string;
    provider: string;
    summary: string;
    pricing: { input: number; output: number; unit: string };
  };
}

export default function WizardClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const selectedValue = answers[step?.key];

  const selectOption = (value: string) => {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  };

  const submitWizard = async () => {
    setLoading(true);
    setShowResults(true);

    // Map frontend answers to API format
    const taskMap: Record<string, string> = {
      coding: 'coding',
      writing: 'writing',
      research: 'research',
      data: 'cheap-volume',
      chatbot: 'chat',
      general: 'other'
    };
    
    const budgetMap: Record<string, string> = {
      unlimited: 'high',
      moderate: 'medium',
      cheap: 'low'
    };

    const payload = {
      task: taskMap[answers.task] || 'other',
      budget: budgetMap[answers.budget] || 'medium',
      longContext: answers.context === 'long',
      agentic: answers.complexity === 'complex'
    };

    try {
      const res = await fetch('/api/wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      setResults(data.recommendations || []);
      setApiMessage(data.message || null);
    } catch (err) {
      console.error("Error fetching wizard results:", err);
      setApiMessage("Failed to fetch recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitWizard();
    }
  };

  const back = () => {
    if (showResults) {
      setShowResults(false);
      setLoading(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const restart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setResults([]);
    setApiMessage(null);
  };

  return (
    <div className="page-container">
      <div className="wizard-container">
        {!showResults ? (
          <>
            <div className="wizard-progress">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`wizard-progress-step ${i < currentStep ? 'completed' : ''} ${i === currentStep ? 'active' : ''}`}
                />
              ))}
            </div>

            <div className="section-label">
              Question {currentStep + 1} of {STEPS.length}
            </div>

            <h2 className="wizard-question">{step.question}</h2>

            <div className="wizard-options">
              {step.options.map((option) => (
                <div
                  key={option.value}
                  className={`wizard-option ${selectedValue === option.value ? 'selected' : ''}`}
                  onClick={() => selectOption(option.value)}
                >
                  <div className="wizard-option-radio" />
                  <div>
                    <div className="wizard-option-label">{option.label}</div>
                    <div className="wizard-option-desc">{option.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="wizard-nav">
              <button
                className="btn btn--ghost"
                onClick={back}
                disabled={currentStep === 0}
                style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
              >
                ← Back
              </button>
              <button
                className="btn btn--primary"
                onClick={next}
                disabled={!selectedValue}
              >
                {currentStep === STEPS.length - 1 ? 'See recommendations' : 'Next →'}
              </button>
            </div>
          </>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
            <h2 className="wizard-question">Calculating best fit...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing model context, pricing, and capabilities against your answers.</p>
          </div>
        ) : (
          <>
            <div className="section-label">Your Recommendations</div>
            <h2 className="wizard-question" style={{ marginBottom: 'var(--space-4)' }}>
              Here&rsquo;s what we&rsquo;d suggest
            </h2>
            
            {apiMessage ? (
              <p style={{ color: 'var(--error)', marginBottom: 'var(--space-6)' }}>{apiMessage}</p>
            ) : (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                Based on your answers, these models are the best fit for your needs.
                Rankings consider task fit, budget, context requirements, and complexity.
              </p>
            )}

            {results.map((result, i) => (
              <Link
                key={result.modelId}
                href={`/models/${result.modelId}`}
                className="result-card"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="result-rank">
                  {i === 0 ? '★ Best Match' : `#${i + 1}`}
                </div>
                <div className="result-model-name">{result.modelData.name}</div>
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <span className="model-card-provider">{result.modelData.provider}</span>
                  <span className="price-badge" style={{ marginLeft: 'var(--space-2)' }}>
                    ${result.modelData.pricing.input.toFixed(2)} / 1M input
                  </span>
                </div>
                <div className="result-reasoning">
                  <p>{result.reason}</p>
                  
                  {result.benchmarkNote && (
                    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                      <strong>⚠️ Benchmark Note:</strong> {result.benchmarkNote}
                    </div>
                  )}
                  
                  {result.tradeoff && (
                    <div style={{ marginTop: 'var(--space-2)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <em>Tradeoff: {result.tradeoff}</em>
                    </div>
                  )}
                </div>
              </Link>
            ))}

            <div className="wizard-nav">
              <button className="btn btn--ghost" onClick={back}>
                ← Back
              </button>
              <button className="btn" onClick={restart}>
                Start over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
