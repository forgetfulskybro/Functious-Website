import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { FEATURES } from '@/data/features';
import FeatureDetailContent from '@/components/features/FeatureDetailContent';

type Params = Promise<{ feature: string }>;

export function generateStaticParams() {
  return FEATURES.map((f) => ({ feature: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { feature: slug } = await params;
  const feature = FEATURES.find(
    (f) => f.slug === slug.toLowerCase()
  );

  if (!feature) {
    return { title: 'Feature Not Found - Functious' };
  }

  return {
    title: `${feature.name} - Functious`,
    description: feature.fullDescription,
  };
}

export default async function FeatureDetailPage({ params }: { params: Params }) {
  const { feature: slug } = await params;
  const feature = FEATURES.find(
    (f) => f.slug === slug.toLowerCase()
  );

  if (!feature) {
    notFound();
  }

  return <FeatureDetailContent feature={feature} />;
}
