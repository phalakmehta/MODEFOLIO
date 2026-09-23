import type { Metadata } from 'next';
import CompareClient from './CompareClient';

export const metadata: Metadata = {
  title: 'Compare Models — Modelfolio',
  description: 'Side-by-side comparison of AI models with specs, pricing, and benchmarks explained in plain language.',
};

export default function ComparePage() {
  return <CompareClient />;
}
