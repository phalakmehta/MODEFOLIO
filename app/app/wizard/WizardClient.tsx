'use client';

import { useState } from 'react';
import Link from 'next/link';
import models from '@/data/models.json';

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

interface ScoredModel {
  model: typeof models[0];
  score: number;
  reasons: string[];
}

function scoreModels(answers: Answers): ScoredModel[] {
  return models.map((model) => {
    let score = 0;
    const reasons: string[] = [];

    // Task matching
    const taskMap: Record<string, string[]> = {
      coding: ['coding', 'agentic'],
      writing: ['writing', 'general'],
      research: ['research', 'complex reasoning', 'long documents'],
      data: ['fast', 'cheap', 'high-volume'],
      chatbot: ['chatbot', 'fast', 'general'],
      general: ['general'],
    };
    const relevantTags = taskMap[answers.task] || [];
    const tagMatches = model.useCaseTags.filter((t) => relevantTags.includes(t));
    score += tagMatches.length * 20;
    if (tagMatches.length > 0) {
      reasons.push(`Strong fit for ${answers.task}: tagged as ${tagMatches.join(', ')}`);
    }

    // Budget
    if (answers.budget === 'cheap') {
      if (model.specs.pricing.input <= 0.5) {
        score += 30;
        reasons.push(`Very affordable at $${model.specs.pricing.input.toFixed(2)}/1M input tokens`);
      } else if (model.specs.pricing.input <= 2) {
        score += 15;
      } else {
        score -= 20;
        reasons.push(`Expensive at $${model.specs.pricing.input.toFixed(2)}/1M input tokens`);
      }
    } else if (answers.budget === 'unlimited') {
      const maxBenchmark = Math.max(...model.benchmarks.map((b) => b.score));
      if (maxBenchmark > 90) {
        score += 20;
        reasons.push(`Top-tier benchmark performance (${maxBenchmark}%)`);
      }
    } else {
      if (model.specs.pricing.input <= 3 && model.specs.pricing.input > 0.3) {
        score += 15;
        reasons.push('Good balance of capability and cost');
      }
    }

    // Context needs
    if (answers.context === 'long') {
      if (model.specs.contextWindow >= 1000000) {
        score += 25;
        reasons.push(`Massive ${(model.specs.contextWindow / 1000000).toFixed(0)}M token context window handles very long documents`);
      } else if (model.specs.contextWindow >= 200000) {
        score += 10;
      } else {
        score -= 10;
      }
    } else if (answers.context === 'short') {
      score += 5; // Any model works
    }

    // Complexity
    if (answers.complexity === 'complex') {
      if (model.useCaseTags.includes('complex reasoning') || model.useCaseTags.includes('agentic')) {
        score += 30;
        reasons.push('Built for complex, multi-step reasoning tasks');
      }
    } else if (answers.complexity === 'simple') {
      if (model.useCaseTags.includes('fast') || model.useCaseTags.includes('cheap')) {
        score += 15;
        reasons.push('Fast and efficient — no need to pay for reasoning overhead on simple tasks');
      }
    }

    return { model, score, reasons };
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);
}

export default function WizardClient() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);

  const step = STEPS[currentStep];
  const selectedValue = answers[step?.key];

  const selectOption = (value: string) => {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  };

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const back = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const restart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  const results = showResults ? scoreModels(answers) : [];

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
        ) : (
          <>
            <div className="section-label">Your Recommendations</div>
            <h2 className="wizard-question" style={{ marginBottom: 'var(--space-4)' }}>
              Here&rsquo;s what we&rsquo;d suggest
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              Based on your answers, these models are the best fit for your needs.
              Rankings consider task fit, budget, context requirements, and complexity.
            </p>

            {results.map((result, i) => (
              <Link
                key={result.model.id}
                href={`/models/${result.model.id}`}
                className="result-card"
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div className="result-rank">
                  {i === 0 ? '★ Best Match' : `#${i + 1}`}
                </div>
                <div className="result-model-name">{result.model.name}</div>
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <span className="model-card-provider">{result.model.provider}</span>
                  <span className="price-badge" style={{ marginLeft: 'var(--space-2)' }}>
                    ${result.model.specs.pricing.input.toFixed(2)} / 1M input
                  </span>
                </div>
                <div className="result-reasoning">
                  {result.reasons.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {result.reasons.map((r, j) => (
                        <li key={j} style={{ marginBottom: '4px' }}>→ {r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{result.model.summary}</p>
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
