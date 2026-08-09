import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { RUNE_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Rune Guide',
  description:
    'Learn Rune, the scripting language behind Functious tags. From your first tag to rich embeds and the full builtin reference.',
};

export default function RuneGuideLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={RUNE_GUIDE}>{children}</GuideShell>;
}
