import type { Metadata } from 'next';
import FaqPageContent from '@/components/faq/FaqPageContent';

export const metadata: Metadata = {
  title: 'FAQ | Functious',
  description:
    'Answers to common Functious questions about reaction roles, autoroles, scheduled messages, birthdays, and media channels.',
};

export default function FaqPage() {
  return <FaqPageContent />;
}
