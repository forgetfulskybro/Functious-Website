import type { Metadata } from 'next';
import HeroSection from '@/components/home/HeroSection';
import ReactionRolesDemo from '@/components/home/ReactionRolesDemo';
import FeaturesGrid from '@/components/home/FeaturesGrid';
import FaqSection from '@/components/home/FaqSection';
import EndPageInvite from '@/components/home/EndPageInvite';
import PollsDemo from '@/components/home/PollsDemo';
import SchedulesDemo from '@/components/home/SchedulesDemo';

export const metadata: Metadata = {
  title: 'Functious - Fluxer companion',
  description:
    'Functious is simple yet useful Fluxer companion bringing live polls, reaction roles, autoroles, tags, and much more.',
};

export default function HomePage() {
  return (
    <main>
      <HeroSection />

      <section aria-label="Reaction Roles Demo">
        <ReactionRolesDemo />
      </section>

      <section id="polls" aria-label="Polls Demo">
        <PollsDemo />
      </section>

      <section aria-label="Scheduled Messages Demo">
        <SchedulesDemo />
      </section>

      <section id="features" aria-label="Features">
        <FeaturesGrid />
      </section>

      <section id="EndPage" aria-label='End Page'>
        <FaqSection />
        <EndPageInvite />
      </section>
    </main>
  );
}
