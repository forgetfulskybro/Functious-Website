'use client';

import Link from 'next/link';
import { useState } from 'react';
import MotionWrapper from '@/components/ui/MotionWrapper';
import type { FeatureData } from '@/data/features';

interface FeatureDetailContentProps {
  feature: FeatureData;
}

export default function FeatureDetailContent({ feature }: FeatureDetailContentProps) {
  const { name, fullDescription, capabilities, usageExamples, relatedCommands } = feature;
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(index);
      console.log(index, copied)
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const mainCommand = relatedCommands[0];
  const relatedGuide = feature.relatedGuides ? feature.relatedGuides[0] : [];

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">

      <Link
        href="/#features"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-orange-light transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
      >
        ← Back to Features
      </Link>

      <MotionWrapper>
        <header className="mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-white">{name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {mainCommand && (
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                <span className="text-sm font-medium text-white/60">Main Command:</span>
                <Link
                  href={`/commands#${mainCommand}`}
                  className="font-mono text-orange hover:text-orange-light transition-colors flex items-center gap-1 group"
                >
                  <code>f!{mainCommand}</code>
                  <span className="text-xs text-white/40 group-hover:text-orange-light">→</span>
                </Link>
              </div>
            )}
          
            {relatedGuide && relatedGuide.length > 0 && (
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                <span className="text-sm font-medium text-white/60">Related Guide:</span>
                <Link
                  href={`/guides/${relatedGuide}`}
                  className="font-mono text-orange hover:text-orange-light transition-colors flex items-center gap-1 group"
                >
                  <code>{relatedGuide}</code>
                  <span className="text-xs text-white/40 group-hover:text-orange-light">→</span>
                </Link>
              </div>
            )}
          </div>
        </header>
      </MotionWrapper>

      <MotionWrapper delay={0.05}>
        <section aria-labelledby="description-heading" className="mb-10">
          <h2 id="description-heading" className="mb-3 text-xl font-semibold text-white/80">
            Overview
          </h2>
          <p className="text-base leading-relaxed text-white/70">{fullDescription}</p>
        </section>
      </MotionWrapper>

      <MotionWrapper delay={0.1}>
        <section aria-labelledby="capabilities-heading" className="mb-10">
          <h2 id="capabilities-heading" className="mb-4 text-xl font-semibold text-white/80">
            Capabilities
          </h2>
          <ul className="space-y-2 pl-4">
            {capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2 text-sm leading-relaxed text-white/70">
                <span className="mt-1 text-orange" aria-hidden="true">✦</span>
                {cap}
              </li>
            ))}
          </ul>
        </section>
      </MotionWrapper>

      <MotionWrapper delay={0.15}>
        <section aria-labelledby="usage-heading" className="mb-10">
          <h2 id="usage-heading" className="mb-4 text-xl font-semibold text-white/80">
            Usage Examples
          </h2>
          <ul className="space-y-3">
            {usageExamples.map((example, index) => (
              <li key={example}>
                <button
                  onClick={() => copy(example, index + 1)}
                  className="group w-full flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 font-mono text-sm text-orange hover:bg-white/10 active:bg-white/15 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                >
                  <code className="text-left select-all">{example}</code>

                  <div
                    className="flex items-center gap-1.5 rounded text-xs text-white/40 transition-colors hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  >
                    {copied && copied === index + 1 ? (
                      <>
                        <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        <span className="font-medium">Copy</span>
                      </>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </MotionWrapper>
    </article>
  );
}
