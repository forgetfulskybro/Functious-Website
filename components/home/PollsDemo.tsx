'use client';

import { useMemo } from 'react';
import { ChannelDemo, type TimelineStep, type StepExplanation } from '@/components/ui/ChannelDemo';

const POLL_CMD =
  'f!polls 2h | Do you like capybaras? | Yes | No | Maybe?';

function formatRelative(date: Date): string {
  const now = new Date();
  const time = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Tomorrow at ${time}`;
  if (dayDiff === -1) return `Yesterday at ${time}`;

  const datePart = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });

  return `${datePart} at ${time}`;
}

function formatAbsolute(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface PollOption {
  label: string;
  votes: number;
}

function PollEmbed({
  endsAtRelative,
  endsAtAbsolute,
  options,
  totalVotes,
}: {
  endsAtRelative: string;
  endsAtAbsolute: string;
  options: PollOption[];
  totalVotes: number;
}) {
  const maxVotes = Math.max(...options.map(o => o.votes), 1);

  return (
    <div className="mt-1.5 w-full max-w-[320px] overflow-hidden rounded-lg border-l-4 border-orange-mid bg-[#1a1210]">
      <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5">
        <span className="text-[11px] font-medium text-white/50">Time:</span>
        <span
          className="inline-flex cursor-default items-center gap-1 rounded bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-white/70 underline decoration-white/25 decoration-dotted underline-offset-2"
          title={endsAtAbsolute}
        >
          <span aria-hidden className="text-[10px] opacity-70">
            🕐
          </span>
          {endsAtRelative}
        </span>
      </div>

      <div className="mx-2 mb-2 rounded-md bg-[#141010] px-3 py-2.5">
        <p className="mb-2.5 text-[13px] font-semibold text-white/90">
          Do you like capybaras?
        </p>

        <div className="space-y-1.5">
          {options.map((opt, i) => {
            const pct = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
            const barPct = totalVotes === 0 ? 0 : Math.round((opt.votes / maxVotes) * 100);
            const leading = opt.votes > 0 && opt.votes === Math.max(...options.map(o => o.votes));

            return (
              <div key={opt.label} className="flex items-center gap-2">
                <span className="w-3 flex-shrink-0 text-[11px] text-white/35">{i + 1}</span>
                <div className="relative min-h-[22px] flex-1 overflow-hidden rounded bg-white/[0.06]">
                  <div
                    className={[
                      'absolute inset-y-0 left-0 rounded transition-all duration-500',
                      leading ? 'bg-orange' : 'bg-white/10',
                    ].join(' ')}
                    style={{ width: `${barPct}%` }}
                  />
                  <div className="relative flex items-center justify-between px-2 py-0.5">
                    <span className="text-[12px] font-medium text-white/85">{opt.label}</span>
                    <span
                      className={[
                        'text-[11px] tabular-nums',
                        leading ? 'text-white/90' : 'text-orange/70',
                      ].join(' ')}
                    >
                      {pct}% ({opt.votes})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-2.5 text-[11px] text-white/35">
          {totalVotes === 0
            ? 'No votes yet'
            : `${totalVotes} vote${totalVotes === 1 ? '' : 's'}`}
        </p>
      </div>
    </div>
  );
}

export default function PollsDemo() {
  const ends = useMemo(() => new Date(Date.now() + 2 * 60 * 60 * 1000), []);
  const endsAtRelative = useMemo(() => formatRelative(ends), [ends]);
  const endsAtAbsolute = useMemo(() => formatAbsolute(ends), [ends]);

  const emptyOptions: PollOption[] = [
    { label: 'Yes', votes: 0 },
    { label: 'No', votes: 0 },
    { label: 'Maybe?', votes: 0 },
  ];

  const votedOptions: PollOption[] = [
    { label: 'Yes', votes: 1 },
    { label: 'No', votes: 0 },
    { label: 'Maybe?', votes: 0 },
  ];

  const TIMELINE: TimelineStep[] = useMemo(
    () => [
      { id: 'idle', label: 'Start', t: 0 },

      {
        id: 'user-types',
        label: 'You type',
        t: 400,
        actions: [
          { type: 'addMessage', message: { id: 'typing-1', author: 'user', typing: true } },
        ],
      },

      {
        id: 'user-cmd',
        label: 'Command sent',
        t: 2200,
        actions: [
          { type: 'deleteMessage', id: 'typing-1' },
          {
            type: 'addMessage',
            message: {
              id: 'cmd',
              author: 'user',
              content: (
                <span className="break-all font-mono text-[13px] text-white/75">
                  {POLL_CMD}
                </span>
              ),
            },
          },
        ],
      },

      {
        id: 'bot-poll',
        label: 'Poll created',
        t: 4000,
        actions: [
          {
            type: 'addMessage',
            message: {
              id: 'poll',
              author: 'bot',
              embed: (
                <PollEmbed
                  endsAtRelative={endsAtRelative}
                  endsAtAbsolute={endsAtAbsolute}
                  options={emptyOptions}
                  totalVotes={0}
                />
              ),
              reactions: [
                { emoji: '1️⃣', count: 1, highlighted: false },
                { emoji: '2️⃣', count: 1, highlighted: false },
                { emoji: '3️⃣', count: 1, highlighted: false },
                { emoji: '🛑', count: 1, highlighted: false },
              ],
            },
          },
        ],
      },

      {
        id: 'user-votes',
        label: 'Vote 1️⃣',
        t: 7500,
        actions: [
          {
            type: 'editMessage',
            id: 'poll',
            patch: {
              embed: (
                <PollEmbed
                  endsAtRelative={endsAtRelative}
                  endsAtAbsolute={endsAtAbsolute}
                  options={votedOptions}
                  totalVotes={1}
                />
              ),
            },
          },
          {
            type: 'editReaction',
            messageId: 'poll',
            emoji: '1️⃣',
            patch: { count: 2, highlighted: true },
          },
        ],
      },

      { id: 'done', label: 'Complete', t: 11000 },
    ],
    [endsAtRelative, endsAtAbsolute]
  );

  const EXPLANATIONS: StepExplanation[] = [
    {
      id: 'user-cmd',
      label: 'Run the command',
      detail:
        'Type f!polls with a duration, the question, and options separated by |',
    },
    {
      id: 'bot-poll',
      label: 'Poll is posted',
      detail:
        'Functious posts an embed with the question, live percentage bars, and number reactions.',
    },
    {
      id: 'user-votes',
      label: 'Members vote',
      detail:
        'React with an option emoji to vote. The bars and percentages update instantly as votes come in.',
    },
  ];

  return (
    <ChannelDemo
      channelName="polls"
      title="See Polls in Action"
      subtitle="One command — a live chart poll in your channel"
      timeline={TIMELINE}
      explanations={EXPLANATIONS}
      explanationsSide="left"
    />
  );
}