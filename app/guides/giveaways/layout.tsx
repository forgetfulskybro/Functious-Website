import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { GIVEAWAY_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Giveaways Guide',
  description: 'Learn how to create, delete, and reroll giveaways with Functious.',
};

export default function GiveawayLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={GIVEAWAY_GUIDE}>{children}</GuideShell>;
}
