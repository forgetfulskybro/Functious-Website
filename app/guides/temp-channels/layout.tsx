import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { TEMP_CHANNELS_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Temp Channels Guide',
  description: 'Learn how to set up on-demand temporary voice channels with Functious.',
};

export default function TempChannelsLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={TEMP_CHANNELS_GUIDE}>{children}</GuideShell>;
}
