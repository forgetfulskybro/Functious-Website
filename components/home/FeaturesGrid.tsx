import { FEATURES } from '@/data/features';
import FeatureCard from '@/components/features/FeatureCard';

export default function FeaturesGrid() {
  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="mb-10 text-center">
        <h2
          id="features-heading"
          className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Useful features for community needs
        </h2>
        <p className="mt-3 text-white/60">
          Everything Functious can do, from reaction roles to scheduled messages.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(feature => (
          <FeatureCard key={feature.slug} feature={feature} />
        ))}
      </div>
    </section>
  );
}