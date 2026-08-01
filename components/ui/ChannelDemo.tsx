'use client';

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export type Author = 'user' | 'bot';

export interface DemoReaction {
  emoji: string;
  count: number;
  highlighted?: boolean;
}

export interface DemoMessage {
  id: string;
  author: Author;
  content?: ReactNode;
  embed?: ReactNode;
  reactions?: DemoReaction[];
  typing?: boolean;
}

export type DemoAction =
  | { type: 'addMessage'; message: DemoMessage }
  | { type: 'editMessage'; id: string; patch: Partial<Omit<DemoMessage, 'id'>> }
  | { type: 'deleteMessage'; id: string }
  | { type: 'addReaction'; messageId: string; reaction: DemoReaction }
  | { type: 'editReaction'; messageId: string; emoji: string; patch: Partial<DemoReaction> }
  | { type: 'removeReaction'; messageId: string; emoji: string }
  | { type: 'clearReactions'; messageId: string };

export interface TimelineStep {
  id: string;
  label: string;
  t: number;
  actions?: DemoAction[];
}

export interface StepExplanation {
  id: string;
  label: string;
  detail: string;
}

function applyAction(messages: DemoMessage[], action: DemoAction): DemoMessage[] {
  switch (action.type) {
    case 'addMessage':
      if (messages.some(m => m.id === action.message.id)) return messages;
      return [...messages, action.message];

    case 'editMessage':
      return messages.map(m =>
        m.id === action.id ? { ...m, ...action.patch } : m
      );

    case 'deleteMessage':
      return messages.filter(m => m.id !== action.id);

    case 'addReaction':
      return messages.map(m => {
        if (m.id !== action.messageId) return m;
        const existing = m.reactions ?? [];
        if (existing.some(r => r.emoji === action.reaction.emoji)) return m;
        return { ...m, reactions: [...existing, action.reaction] };
      });

    case 'editReaction':
      return messages.map(m => {
        if (m.id !== action.messageId) return m;
        return {
          ...m,
          reactions: (m.reactions ?? []).map(r =>
            r.emoji === action.emoji ? { ...r, ...action.patch } : r
          ),
        };
      });

    case 'removeReaction':
      return messages.map(m => {
        if (m.id !== action.messageId) return m;
        return {
          ...m,
          reactions: (m.reactions ?? []).filter(r => r.emoji !== action.emoji),
        };
      });

    case 'clearReactions':
      return messages.map(m =>
        m.id === action.messageId ? { ...m, reactions: [] } : m
      );

    default:
      return messages;
  }
}

function messagesAtTime(timeline: TimelineStep[], elapsed: number): DemoMessage[] {
  let messages: DemoMessage[] = [];
  for (const step of timeline) {
    if (elapsed < step.t) break;
    for (const action of step.actions ?? []) {
      messages = applyAction(messages, action);
    }
  }
  return messages;
}

function phaseFromTime(timeline: TimelineStep[], elapsed: number): string {
  let current = timeline[0]?.id ?? 'idle';
  for (const step of timeline) {
    if (elapsed >= step.t) current = step.id;
  }
  return current;
}

interface ChannelDemoProps {
  channelName?: string;
  timeline: TimelineStep[];
  explanations?: StepExplanation[];
  explanationsSide?: 'left' | 'right';
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  className?: string;
}

export function ChannelDemo({
  channelName = 'general',
  timeline,
  explanations = [],
  explanationsSide = 'right',
  title,
  subtitle,
  autoPlay = false,
  className = '',
}: ChannelDemoProps) {
  const TOTAL_MS = (timeline[timeline.length - 1]?.t ?? 0) + 800;

  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(!autoPlay);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = messagesAtTime(timeline, elapsed);
  const phase = phaseFromTime(timeline, elapsed);
  const stepOrder = timeline.map(s => s.id);
  const currentStepIdx = stepOrder.indexOf(phase);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const tick = useCallback(
    (now: number) => {
      if (startRef.current === null) return;
      const newElapsed = offsetRef.current + (now - startRef.current);
      if (newElapsed >= TOTAL_MS) {
        setElapsed(TOTAL_MS);
        setPlaying(false);
        return;
      }
      setElapsed(newElapsed);
      rafRef.current = requestAnimationFrame(tick);
    },
    [TOTAL_MS]
  );

  const play = useCallback(() => {
    if (elapsed >= TOTAL_MS) {
      offsetRef.current = 0;
      setElapsed(0);
      setShowOverlay(false);
    } else {
      offsetRef.current = elapsed;
    }
    startRef.current = performance.now();
    setPlaying(true);
    setShowOverlay(false);
    rafRef.current = requestAnimationFrame(tick);
  }, [elapsed, tick, TOTAL_MS]);

  const pause = useCallback(() => {
    setPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    startRef.current = null;
  }, []);

  useEffect(() => {
    if (autoPlay) {
      setShowOverlay(false);
      play();
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, tick]);

  const seek = useCallback(
    (newElapsed: number) => {
      pause();
      offsetRef.current = newElapsed;
      setElapsed(newElapsed);
      setShowOverlay(false);
    },
    [pause]
  );

  const seekToStep = useCallback(
    (stepId: string) => {
      const step = timeline.find(s => s.id === stepId);
      if (step) seek(step.t);
    },
    [seek, timeline]
  );

  const explanationsPanel =
      explanations.length > 0 ? (
        <div className="flex-shrink-0 lg:w-72 xl:w-80">
          <h3 className="mb-6 text-lg font-semibold text-white/90">How it works</h3>
          {explanations.map((step, index) => {
            const stepIdx = stepOrder.indexOf(step.id);
            const nextId = explanations[index + 1]?.id;
            const nextIdx = nextId ? stepOrder.indexOf(nextId) : 999;
            const isActive =
              currentStepIdx >= stepIdx && currentStepIdx < nextIdx;
            const isPassed = currentStepIdx > stepIdx && !isActive;
  
            return (
              <motion.div
                key={step.id}
                animate={{ opacity: isActive ? 1 : isPassed ? 0.5 : 0.3 }}
                transition={{ duration: 0.4 }}
                className="mb-5 flex cursor-pointer gap-3"
                onClick={() => seekToStep(step.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && seekToStep(step.id)}
              >
                <div
                  className={[
                    'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-500',
                    isActive
                      ? 'bg-orange text-white'
                      : isPassed
                        ? 'bg-orange/30 text-orange/80'
                        : 'bg-white/10 text-white/40',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {elapsed >= TOTAL_MS || isPassed ? '✓' : index + 1}
                </div>
                <div>
                  <p
                    className={[
                      'text-sm font-semibold transition-colors duration-300',
                      isActive ? 'text-white' : 'text-white/55',
                    ].join(' ')}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/40">
                    {step.detail}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null;

  return (
      <section
        className={`mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8 ${className}`}
        aria-label="Channel demo"
      >
        {(title || subtitle) && (
          <div className="mb-10 text-center">
            {title && (
              <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
            )}
            {subtitle && <p className="mt-3 text-white/60">{subtitle}</p>}
          </div>
        )}
  
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          {explanationsSide === 'left' && explanationsPanel}
  
          <div className="relative min-w-0 flex-1">
            <div
              className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#1e1e24] shadow-2xl"
              role="region"
              aria-label="Fluxer channel simulation"
            >
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
                <span className="text-sm font-medium text-white/40">#</span>
                <span className="text-sm font-semibold text-white/70">{channelName}</span>
              </div>
  
              <div
                ref={scrollRef}
                className="h-[380px] overflow-x-hidden overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              >
                <div className="flex min-h-full flex-col justify-end gap-4">
                  <AnimatePresence mode="popLayout">
                    {messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6, transition: { duration: 0.35 } }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="flex gap-3"
                      >
                        {msg.author === 'bot' ? <BotAvatar /> : <UserAvatar />}
  
                        {msg.typing ? (
                          <div className="flex items-center gap-2 pt-1.5 text-xs italic text-white/40">
                            <TypingDots />
                            You are typing…
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <MessageHeader
                              name={msg.author === 'bot' ? 'Functious' : 'You'}
                              isBot={msg.author === 'bot'}
                            />
                            {msg.content && (
                              <div className="mt-0.5 text-sm leading-relaxed text-white/70">
                                {msg.content}
                              </div>
                            )}
                            {msg.embed}
                            {msg.reactions && msg.reactions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <AnimatePresence>
                                  {msg.reactions.map(r => (
                                    <motion.span
                                      key={r.emoji}
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.5 }}
                                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    >
                                      <ReactionPill
                                        emoji={r.emoji}
                                        count={r.count}
                                        highlighted={!!r.highlighted}
                                      />
                                    </motion.span>
                                  ))}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
  
              <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={playing ? pause : play}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange/20 text-orange transition-colors hover:bg-orange/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                    aria-label={
                      playing ? 'Pause' : elapsed >= TOTAL_MS ? 'Replay' : 'Play'
                    }
                  >
                    {playing ? (
                      <PauseIcon />
                    ) : elapsed >= TOTAL_MS ? (
                      <span className="text-xs leading-none">↺</span>
                    ) : (
                      <PlayIcon />
                    )}
                  </button>
  
                  <div className="relative h-1.5 flex-1">
                    <div className="absolute inset-0 rounded-full bg-white/10" />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-orange"
                      style={{ width: `${(elapsed / TOTAL_MS) * 100}%` }}
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-orange shadow"
                      style={{ left: `calc(${(elapsed / TOTAL_MS) * 100}% - 6px)` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={TOTAL_MS}
                      step={50}
                      value={elapsed}
                      onChange={e => seek(Number(e.target.value))}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      aria-label="Demo timeline position"
                    />
                  </div>
                </div>
              </div>
            </div>
  
            <AnimatePresence>
              {showOverlay && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  onClick={play}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/55 backdrop-blur-[2px] transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                  aria-label="Play demo"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange text-white shadow-lg shadow-orange/30 transition-transform hover:scale-105">
                    <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current">
                      <polygon points="6,3 20,12 6,21" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-white/80">Watch the demo</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
  
          {explanationsSide !== 'left' && explanationsPanel}
        </div>
      </section>
    );
}

function BotAvatar() {
  return (
    <Image
      src="/Functious.png"
      alt="Functious bot"
      width={32}
      height={32}
      className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
    />
  );
}

function UserAvatar() {
  return (
    <Image
      src="/Functious_inverted.png"
      alt="User"
      width={32}
      height={32}
      className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
    />
  );
}

function MessageHeader({ name, isBot }: { name: string; isBot?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-sm font-semibold ${isBot ? 'text-orange-300' : 'text-white/80'}`}>
        {name}
      </span>
      {isBot && (
        <span className="rounded bg-orange/20 px-1 py-0.5 text-xs leading-none text-white/35">
          BOT
        </span>
      )}
    </div>
  );
}

function ReactionPill({
  emoji,
  count,
  highlighted,
}: {
  emoji: string;
  count: number;
  highlighted: boolean;
}) {
  return (
    <span
      className={[
        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors duration-200',
        highlighted
          ? 'border-[#413CDA] bg-[#221F5D] text-white'
          : 'border-white/20 bg-white/5 text-white/70',
      ].join(' ')}
    >
      {emoji}
      <span className="text-xs text-white/50">{count}</span>
    </span>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-white/30"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 10 10" className="h-3 w-3 fill-current">
      <polygon points="2,1 9,5 2,9" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 10 10" className="h-3 w-3 fill-current">
      <rect x="1.5" y="1" width="3" height="8" />
      <rect x="5.5" y="1" width="3" height="8" />
    </svg>
  );
}