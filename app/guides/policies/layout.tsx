import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { POLICIES_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Command Policies Guide',
  description: 'Learn how to configure command availability, channels, roles, cooldowns, and cleanup with Functious.',
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={POLICIES_GUIDE}>{children}</GuideShell>;
}
