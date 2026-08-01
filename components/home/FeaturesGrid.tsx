import { FEATURES } from '@/data/features';
import FeatureCard from '@/components/features/FeatureCard';

export default function FeaturesGrid() {
  return (
    <section
      className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <h2
        id="features-heading"
        className="mb-8 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        Useful features for server needs
      </h2>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.slug} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}