import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { REACTION_ROLES_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Reaction Roles Guide',
  description: 'Learn how to create, edit, and manage reaction role panels with Functious.',
};

export default function ReactionRolesLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={REACTION_ROLES_GUIDE}>{children}</GuideShell>;
}
