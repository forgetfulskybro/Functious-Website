'use client';

import { useState } from 'react';
import { FAQ } from '@/data/faq';
import FaqItem from './FaqItem';

interface FaqSectionProps {
  allowMultiple?: boolean;
}

export default function FaqSection({ allowMultiple = false }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) {
          next.delete(index);
        } else {
          next.add(index);
        }
        return next;
      });
    } else {
      setOpenIndex((prev) => (prev === index ? null : index));
    }
  };

  const isOpen = (index: number): boolean => {
    return allowMultiple ? openIndices.has(index) : openIndex === index;
  };

  return (
    <section
      id="faq"
      className="mx-auto w-full bg-[#1a0808] border-t border-orange-mid/25 px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl">
      <h2
        id="faq-heading"
        className="mb-10 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl"
      >
        Frequently Asked Questions
      </h2>

      <div className="divide-y divide-orange-mid/15 rounded-xl border border-orange-mid/20 bg-[#1f0d08] px-6">
        {FAQ.map((item, index) => (
          <FaqItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={isOpen(index)}
            onTogglAction={() => handleToggle(index)}
          />
        ))}
        </div>
      </div>
    </section>
  );
}

export function simulateToggle(currentOpenIndex: number | null, index: number): number | null {
  return currentOpenIndex === index ? null : index;
}
