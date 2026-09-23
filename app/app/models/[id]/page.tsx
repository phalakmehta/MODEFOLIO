import models from '@/data/models.json';
import { notFound } from 'next/navigation';
import ModelDetailClient from './ModelDetailClient';

type Params = { id: string };

export async function generateStaticParams() {
  return models.map((model) => ({ id: model.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const model = models.find((m) => m.id === id);
  if (!model) return {};
  return {
    title: `${model.name} — Modelfolio`,
    description: model.summary,
  };
}

export default async function ModelDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const model = models.find((m) => m.id === id);
  if (!model) notFound();
  return <ModelDetailClient model={model} />;
}
