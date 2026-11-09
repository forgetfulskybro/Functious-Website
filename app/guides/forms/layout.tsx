import type { Metadata } from 'next';
import GuideShell from '@/components/guide/GuideShell';
import { FORMS_GUIDE } from '@/data/guides';

export const metadata: Metadata = {
  title: 'Forms Guide',
  description: 'Learn how to build private application forms, use Form Menu, and review submissions with Functious.',
};

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return <GuideShell guide={FORMS_GUIDE}>{children}</GuideShell>;
}
