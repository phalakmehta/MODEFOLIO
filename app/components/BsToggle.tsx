'use client';

import { useTranslation } from '@/app/TranslationContext';

export default function BsToggle() {
  const { plainEnglish, togglePlainEnglish } = useTranslation();

  return (
    <div className="bs-toggle-container">
      <span className="bs-toggle-label">Plain English Mode</span>
      <button 
        className={`bs-toggle ${plainEnglish ? 'active' : ''}`} 
        onClick={togglePlainEnglish}
        aria-label="Toggle Plain English Mode"
      >
        <div className="bs-toggle-knob" />
      </button>
    </div>
  );
}
