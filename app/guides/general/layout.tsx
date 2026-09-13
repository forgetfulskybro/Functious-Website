import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { GENERAL_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'General Commands Guide',
  description: 'A reference for theme, polls, bypass roles, and other everyday Functious commands.',
};

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={GENERAL_GUIDE}>{children}</GuideShell>;
}
