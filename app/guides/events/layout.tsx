import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { EVENTS_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Events Guide',
  description: 'Learn how to create community events, collect RSVPs, and manage attendees with Functious.',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={EVENTS_GUIDE}>{children}</GuideShell>;
}
