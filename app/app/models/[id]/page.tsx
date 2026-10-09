import { models, getModelById, displayName } from '@/lib/data';
import { notFound } from 'next/navigation';
import ModelDetailClient from './ModelDetailClient';

type Params = { id: string };

export async function generateStaticParams() {
  return models.map((model) => ({ id: model.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const model = getModelById(id);
  if (!model) return {};
  const retired = model.status === 'legacy' ? ' (no longer available)' : '';
  return {
    title: `${displayName(model.name)}${retired} — Modelfolio`,
    description: model.summary,
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const model = getModelById(id);
  if (!model) notFound();
  return <ModelDetailClient model={model} />;
}
