import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { STICKIES_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Sticky Messages Guide',
  description: 'Learn how to create, edit, and manage sticky messages with Functious.',
};

export default function StickiesLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={STICKIES_GUIDE}>{children}</GuideShell>;
}
