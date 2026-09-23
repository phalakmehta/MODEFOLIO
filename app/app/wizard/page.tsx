import type { Metadata } from 'next';
import WizardClient from './WizardClient';

export const metadata: Metadata = {
  title: 'Which AI Model Should I Use? — Modelfolio',
  description: 'Answer a few simple questions and get a personalized AI model recommendation with plain-language reasoning.',
};

export default function WizardPage() {
  return <WizardClient />;
}
