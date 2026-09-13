import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { SCHEDULE_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Scheduled Messages Guide',
  description: 'Learn how to schedule messages, polls, giveaways, and reminders with Functious.',
};

export default function ScheduleLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={SCHEDULE_GUIDE}>{children}</GuideShell>;
}
