import { FEATURES } from '@/data/features';
import FeatureCard from '@/components/features/FeatureCard';

export default function FeaturesGrid() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="mb-10 max-w-2xl">
        <h2
          id="features-heading"
          className="font-display text-3xl font-light tracking-tight text-white sm:text-4xl"
        >
          Useful features for community needs
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(feature => (
          <FeatureCard key={feature.slug} feature={feature} />
        ))}
      </div>
    </section>
  );
}