'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TranslationContextType {
  plainEnglish: boolean;
  togglePlainEnglish: () => void;
  translate: (type: 'context' | 'pricing' | 'arch' | 'benchmark', value: number | string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [plainEnglish, setPlainEnglish] = useState(false);

  const togglePlainEnglish = () => setPlainEnglish(prev => !prev);

  const translate = (type: 'context' | 'pricing' | 'arch' | 'benchmark', value: number | string) => {
    if (!plainEnglish) return String(value);

    switch (type) {
      case 'context': {
        const ctx = Number(value);
        if (ctx >= 1000000) return 'Reads entire codebases / multiple books at once';
        if (ctx >= 200000) return 'Reads ~500 page book or medium codebase';
        if (ctx >= 100000) return 'Reads a novel or several long documents';
        if (ctx >= 32000) return 'Reads a long paper or 20-30 code files';
        return 'Reads a few articles or short code files';
      }
      case 'pricing': {
        const price = Number(value);
        if (price >= 15) return 'Very Expensive (Premium Tasks Only)';
        if (price >= 5) return 'Expensive (Use for hard problems)';
        if (price >= 1) return 'Moderate (Good for standard work)';
        if (price >= 0.1) return 'Very Cheap (Use for high-volume pipelines)';
        return 'Basically Free (Sub-cent routing)';
      }
      case 'arch': {
        return value === 'mixture-of-experts' || value === 'moe' 
          ? 'Team of specialists (Fast & cheap for its size)'
          : 'Generalist (Consistent but uses more power)';
      }
      case 'benchmark': {
        const score = Number(value);
        if (score >= 90) return 'Tops standardized tests (but might still fail real tasks)';
        if (score >= 80) return 'Solid baseline knowledge';
        return 'Struggles with advanced academic questions';
      }
      default:
        return String(value);
    }
  };

  return (
    <TranslationContext.Provider value={{ plainEnglish, togglePlainEnglish, translate }}>
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
