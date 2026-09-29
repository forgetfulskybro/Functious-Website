'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FEATURED_FAQ } from '@/data/faq';
import FaqItem from '@/components/faq/FaqItem';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faq"
      className="mx-auto w-full border-t border-orange-mid/25 bg-[#1a0808] px-4 py-16 sm:px-6 lg:px-8"
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
          {FEATURED_FAQ.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/faq"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          >
            <span>View all FAQs</span>
            <span
              className="text-white/40 transition-colors group-hover:text-white/70"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
