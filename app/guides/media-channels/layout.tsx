import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { MEDIA_CHANNELS_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Media Channels Guide',
  description: 'Learn how to restrict channels to media-only content with Functious.',
};

export default function MediaChannelsLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={MEDIA_CHANNELS_GUIDE}>{children}</GuideShell>;
}
