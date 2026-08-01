'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChannelDemo, type TimelineStep, type StepExplanation } from '@/components/ui/ChannelDemo';

export function formatRoleTag(name: string): string {
  return `{role:${name}}`;
}

const ROLES = [
  { name: 'Blue', emoji: '🔵', color: 'text-blue-400' },
  { name: 'Red', emoji: '🔴', color: 'text-red-400' },
  { name: 'Purple', emoji: '🟣', color: 'text-purple-400' },
];

function roleTagsContent(resolvedCount: number) {
  return (
    <>
      Color Roles:{' '}
      {ROLES.map((role, i) => {
        const resolved = i < resolvedCount;
        return (
          <span key={role.name} className="inline-block mr-1">
            <AnimatePresence mode="wait" initial={false}>
              {resolved ? (
                <motion.span
                  key="resolved"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className={`font-semibold ${role.color}`}
                >
                  {role.emoji} {role.name}
                </motion.span>
              ) : (
                <motion.span
                  key="tag"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="font-mono text-xs bg-white/10 rounded px-1 text-white/60"
                >
                  {formatRoleTag(role.name)}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        );
      })}
    </>
  );
}

const setupEmbed = (
  <div className="mt-1.5 w-full max-w-[340px] overflow-hidden rounded-lg border-l-4 border-orange-mid bg-[#1a1210]">
    <div className="px-3 pt-2.5 pb-1">
      <p className="text-[13px] font-semibold text-white/90">Setting up Reaction Roles</p>
      <p className="mt-0.5 text-[11px] text-white/40">Follow the steps below to finish setup</p>
    </div>

    <div className="mx-2 mb-2 space-y-1.5 rounded-md bg-[#141010] px-3 py-2.5">
      <div className="flex gap-2">
        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-orange/20 text-[10px] font-bold text-orange">
          1
        </span>
        <p className="text-[12px] leading-relaxed text-white/70">
          Send a message using{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-[11px] text-orange-300">
            {'{role:Name}'}
          </code>{' '}
          tags where each role should appear.
        </p>
      </div>

      <div className="flex gap-2">
        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-orange/20 text-[10px] font-bold text-orange">
          2
        </span>
        <p className="text-[12px] leading-relaxed text-white/70">
          React to the bot&apos;s copy with emojis <span className="text-white/90">in order</span>.
        </p>
      </div>

      <div className="flex gap-2">
        <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-orange/20 text-[10px] font-bold text-orange">
          3
        </span>
        <p className="text-[12px] leading-relaxed text-white/70">
          React <span className="text-white/90">✅</span> on this message when you&apos;re done, or{' '}
          <span className="text-white/90">❌</span> to cancel.
        </p>
      </div>

      <div className="mt-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
          Example
        </p>
        <p className="font-mono text-[11px] leading-relaxed text-white/55">
          Color Roles:{' '}
          <span className="text-orange-300/80">{'{role:Blue}'}</span>{' '}
          <span className="text-orange-300/80">{'{role:Red}'}</span>{' '}
          <span className="text-orange-300/80">{'{role:Purple}'}</span>
        </p>
      </div>
    </div>
  </div>
);

const TIMELINE: TimelineStep[] = [
  { id: 'idle', label: 'Start', t: 0 },

  {
    id: 'user-types',
    label: 'You type',
    t: 100,
    actions: [
      { type: 'addMessage', message: { id: 'typing-1', author: 'user', typing: true } },
    ],
  },

  {
    id: 'user-cmd',
    label: 'User Command',
    t: 800,
    actions: [
      { type: 'deleteMessage', id: 'typing-1' },
      {
        type: 'addMessage',
        message: { id: 'cmd', author: 'user', content: 'f!roles create' },
      },
    ],
  },

  {
    id: 'bot-embed',
    label: 'Bot instructions',
    t: 2200,
    actions: [
      { type: 'deleteMessage', id: 'cmd' },
      {
        type: 'addMessage',
        message: {
          id: 'setup',
          author: 'bot',
          embed: setupEmbed,
          reactions: [
            { emoji: '✅', count: 1, highlighted: false },
            { emoji: '❌', count: 1, highlighted: false },
          ],
        },
      },
    ],
  },

  {
    id: 'user-types1',
    label: 'You type',
    t: 5000,
    actions: [
      { type: 'addMessage', message: { id: 'typing-2', author: 'user', typing: true } },
    ],
  },

  {
    id: 'user-msg',
    label: 'Your message',
    t: 7000,
    actions: [
      { type: 'deleteMessage', id: 'typing-2' },
      {
        type: 'addMessage',
        message: {
          id: 'user-roles',
          author: 'user',
          content: (
            <>
              Color Roles:{' '}
              {ROLES.map(r => (
                <span
                  key={r.name}
                  className="mr-1 inline-block rounded bg-white/10 px-1 font-mono text-xs text-white/60"
                >
                  {formatRoleTag(r.name)}
                </span>
              ))}
            </>
          ),
        },
      },
    ],
  },

  {
    id: 'msg-deleted',
    label: 'Bot copies',
    t: 9100,
    actions: [{ type: 'deleteMessage', id: 'user-roles' }],
  },

  {
    id: 'bot-copies',
    label: 'Bot message',
    t: 10000,
    actions: [
      {
        type: 'addMessage',
        message: {
          id: 'bot-roles',
          author: 'bot',
          content: roleTagsContent(0),
        },
      },
    ],
  },

  {
    id: 'react-0',
    label: '🔵 React',
    t: 11200,
    actions: [
      {
        type: 'editMessage',
        id: 'bot-roles',
        patch: { content: roleTagsContent(1) },
      },
      {
        type: 'addReaction',
        messageId: 'bot-roles',
        reaction: { emoji: '🔵', count: 1, highlighted: true },
      },
    ],
  },

  {
    id: 'react-1',
    label: '🔴 React',
    t: 12600,
    actions: [
      {
        type: 'editMessage',
        id: 'bot-roles',
        patch: { content: roleTagsContent(2) },
      },
      {
        type: 'addReaction',
        messageId: 'bot-roles',
        reaction: { emoji: '🔴', count: 1, highlighted: true },
      },
    ],
  },

  {
    id: 'react-2',
    label: '🟣 React',
    t: 14000,
    actions: [
      {
        type: 'editMessage',
        id: 'bot-roles',
        patch: { content: roleTagsContent(3) },
      },
      {
        type: 'addReaction',
        messageId: 'bot-roles',
        reaction: { emoji: '🟣', count: 1, highlighted: true },
      },
    ],
  },

  {
    id: 'check-react',
    label: '✅ Done',
    t: 15600,
    actions: [
      {
        type: 'editReaction',
        messageId: 'setup',
        emoji: '✅',
        patch: { count: 2, highlighted: true },
      },
    ],
  },

  {
    id: 'delete-bot-embed',
    label: 'Delete Bot Embed',
    t: 17000,
    actions: [{ type: 'deleteMessage', id: 'setup' }],
  },

  { id: 'done', label: 'Complete', t: 17300 },
];

const EXPLANATIONS: StepExplanation[] = [
  {
    id: 'bot-embed',
    label: 'Run the command',
    detail:
      'Type f!roles create. Functious sends a setup embed showing the {role:Name} format, with ✅ and ❌ reactions.',
  },
  {
    id: 'user-types1',
    label: 'Write your message',
    detail:
      'Send a message with {role:Blue}, {role:Red}, etc. wherever each role should appear.',
  },
  {
    id: 'msg-deleted',
    label: 'Bot copies & deletes yours',
    detail:
      "Functious deletes your original message and sends its own copy. React to the bot's message with emojis in order.",
  },
  {
    id: 'react-0',
    label: 'React — roles update live',
    detail:
      'Each emoji you add is immediately paired to the matching {role:X} tag. The tag flips to the emoji + role name right away.',
  },
  {
    id: 'check-react',
    label: 'React ✅ to finish',
    detail:
      "Once all emojis are added, react ✅ on the bot's message. The reaction role message is now live.",
  },
];

export default function ReactionRolesDemo() {
  return (
    <ChannelDemo
      channelName="roles"
      title="See Reaction Roles in Action"
      subtitle="The full setup flow — exactly how it works in your server"
      timeline={TIMELINE}
      explanations={EXPLANATIONS}
    />
  );
}