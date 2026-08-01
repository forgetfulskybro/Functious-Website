'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onTogglAction: () => void;
}

export default function FaqItem({ question, answer, isOpen, onTogglAction }: FaqItemProps) {
  return (
    <div className="border-b border-orange-mid/15">
      <button
        type="button"
        onClick={onTogglAction}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
      >
        <span className="text-base font-medium leading-snug">{question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-white/50"
          aria-hidden="true"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm leading-relaxed text-white/70">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
