'use client';

import { useMemo } from 'react';
import { ChannelDemo, type TimelineStep, type StepExplanation } from '@/components/ui/ChannelDemo';

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

function OrangeEmbed({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-1.5 w-full max-w-[400px] overflow-hidden rounded-lg border-l-4 border-orange-mid bg-[#1a1210]">
      <div className="px-3 py-2.5">
        {title && (
          <p className="mb-1 text-[13px] font-semibold text-white/90">{title}</p>
        )}
        <div className="text-[12px] leading-relaxed text-white/70">{children}</div>
      </div>
    </div>
  );
}

export default function ScheduledMessagesDemo() {
  const sendAt = useMemo(() => new Date(Date.now() + 2 * 60 * 60 * 1000), []);
  const sendAtRelative = useMemo(() => formatRelative(sendAt), [sendAt]);
  const sendAtAbsolute = useMemo(() => formatAbsolute(sendAt), [sendAt]);

  const TIMELINE: TimelineStep[] = useMemo(
    () => [
      { id: 'idle', label: 'Start', t: 0 },

      {
        id: 'user-types-cmd',
        label: 'You type',
        t: 300,
        actions: [{ type: 'addMessage', message: { id: 'typing-1', author: 'user', typing: true } }],
      },

      {
        id: 'user-cmd',
        label: 'Start schedule',
        t: 1600,
        actions: [
          { type: 'deleteMessage', id: 'typing-1' },
          {
            type: 'addMessage',
            message: {
              id: 'cmd',
              author: 'user',
              content: <span className="font-mono text-[13px] text-white/75">f!schedule content #announcements</span>,
            },
          },
        ],
      },

      {
        id: 'ask-content',
        label: 'Ask for content',
        t: 2800,
        actions: [
          { type: 'deleteMessage', id: 'cmd' },
          {
            type: 'addMessage',
            message: {
              id: 'prompt-content',
              author: 'bot',
              embed: (
                <OrangeEmbed title="What would you like your message to be?">
                  Send a message in chat. You can edit your message instead of restarting in case you messed something up.
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      {
        id: 'user-types-content',
        label: 'You type',
        t: 5200,
        actions: [{ type: 'addMessage', message: { id: 'typing-2', author: 'user', typing: true } }],
      },

      {
        id: 'user-content',
        label: 'Content sent',
        t: 6800,
        actions: [
          { type: 'deleteMessage', id: 'typing-2' },
          {
            type: 'addMessage',
            message: {
              id: 'content',
              author: 'user',
              content: 'Server maintenance starts at 8pm tonight. Expect ~30 minutes of downtime.',
            },
          },
        ],
      },

      {
        id: 'ask-webhook',
        label: 'Webhook prompt',
        t: 8500,
        actions: [
          { type: 'deleteMessage', id: 'content' },
          {
            type: 'editMessage',
            id: 'prompt-content',
            patch: {
              embed: (
                <OrangeEmbed title="Would you like to send this as a webhook?">
                  Webhooks let you send messages with a custom name and avatar.<br /><br />
                  Type yes to set up a webhook, or no to skip.
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      {
        id: 'user-types-webhook',
        label: 'You type',
        t: 10200,
        actions: [{ type: 'addMessage', message: { id: 'typing-3', author: 'user', typing: true } }],
      },

      {
        id: 'user-webhook-yes',
        label: 'Webhook choice',
        t: 11000,
        actions: [
          { type: 'deleteMessage', id: 'typing-3' },
          { type: 'addMessage', message: { id: 'webhook-yes', author: 'user', content: 'yes' } },
        ],
      },

      {
        id: 'webhook-name',
        label: 'Webhook name prompt',
        t: 12500,
        actions: [
          { type: 'deleteMessage', id: 'webhook-yes' },
          {
            type: 'editMessage',
            id: 'prompt-content',
            patch: {
              embed: (
                <OrangeEmbed title="What name should the webhook use?">
                  Send a message with the name you want. Maximum of 80 characters.<br />
                  Type skip to use the bot's name.
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      {
        id: 'user-types-name',
        label: 'You type',
        t: 14200,
        actions: [{ type: 'addMessage', message: { id: 'typing-4', author: 'user', typing: true } }],
      },

      {
        id: 'user-name-skip',
        label: 'Skip webhook name',
        t: 15000,
        actions: [
          { type: 'deleteMessage', id: 'typing-4' },
          { type: 'addMessage', message: { id: 'name-skip', author: 'user', content: 'skip' } },
        ],
      },

      {
        id: 'webhook-avatar',
        label: 'Webhook avatar prompt',
        t: 16700,
        actions: [
          { type: 'deleteMessage', id: 'name-skip' },
          {
            type: 'editMessage',
            id: 'prompt-content',
            patch: {
              embed: (
                <OrangeEmbed title="What avatar URL should the webhook use?">
                  Send a link to an image.<br />
                  Type skip to use the default bot avatar.
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      {
        id: 'user-types-avatar',
        label: 'You type',
        t: 18400,
        actions: [{ type: 'addMessage', message: { id: 'typing-5', author: 'user', typing: true } }],
      },

      {
        id: 'user-avatar-skip',
        label: 'Skip avatar',
        t: 19200,
        actions: [
          { type: 'deleteMessage', id: 'typing-5' },
          { type: 'addMessage', message: { id: 'avatar-skip', author: 'user', content: 'skip' } },
        ],
      },

      {
        id: 'ask-recurring',
        label: 'Recurring prompt',
        t: 20900,
        actions: [
          { type: 'deleteMessage', id: 'avatar-skip' },
          {
            type: 'editMessage',
            id: 'prompt-content',
            patch: {
              embed: (
                <OrangeEmbed title="How often should this repeat?">
                  Type one of the following options:<br />
                  • none<br />
                  • daily<br />
                  • weekly<br />
                  • monthly<br />
                  • cron:min hour dom mon dow
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      {
        id: 'user-types-recurring',
        label: 'You type',
        t: 22600,
        actions: [{ type: 'addMessage', message: { id: 'typing-6', author: 'user', typing: true } }],
      },

      {
        id: 'user-recurring',
        label: 'Recurring choice',
        t: 23400,
        actions: [
          { type: 'deleteMessage', id: 'typing-6' },
          { type: 'addMessage', message: { id: 'recurring-weekly', author: 'user', content: 'weekly' } },
        ],
      },

      {
        id: 'ask-time',
        label: 'Time prompt',
        t: 25100,
        actions: [
          { type: 'deleteMessage', id: 'recurring-weekly' },
          {
            type: 'editMessage',
            id: 'prompt-content',
            patch: {
              embed: (
                <OrangeEmbed title="When would you like this to be sent?">
                  (e.g. 2:30pm, in 30 minutes, 6:00am)
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      {
        id: 'user-types-time',
        label: 'You type',
        t: 26800,
        actions: [{ type: 'addMessage', message: { id: 'typing-7', author: 'user', typing: true } }],
      },

      {
        id: 'user-time',
        label: 'Time sent',
        t: 27600,
        actions: [
          { type: 'deleteMessage', id: 'typing-7' },
          { type: 'addMessage', message: { id: 'time-final', author: 'user', content: 'in 3 hours' } },
        ],
      },

      {
        id: 'confirm',
        label: 'Confirmed',
        t: 29300,
        actions: [
          { type: 'deleteMessage', id: 'time-final' },
          {
            type: 'editMessage',
            id: 'prompt-content',
            patch: {
              embed: (
                <OrangeEmbed>
                  <div className="space-y-1.5">
                    <p><span className="text-orange-300">Message scheduled. It will be sent </span>
                      <span
                        className="inline-flex cursor-default items-center gap-1 rounded bg-white/[0.07] px-1.5 py-0.5 text-[11px] text-white/70 underline decoration-white/25 decoration-dotted underline-offset-2"
                        title={sendAtAbsolute}
                      >
                        <span aria-hidden className="text-[10px] opacity-70">
                          🕐
                        </span>
                        {sendAtRelative}
                      </span>
                      <span> in </span>
                      <span className="inline-flex items-center rounded-md bg-[#3f4a5a] px-1.5 py-px text-[#5ba1e7] text-sm font-medium ring-1 ring-inset ring-[#5ba1e7]/30">
                        #announcements
                      </span>                    </p>
                    <p><span className="text-orange-300">Repeats: weekly</span></p>
                  </div>
                </OrangeEmbed>
              ),
            },
          },
        ],
      },

      { id: 'done', label: 'Complete', t: 32000 },
    ],
    [sendAtRelative, sendAtAbsolute]
  );

  const EXPLANATIONS: StepExplanation[] = [
    { id: 'ask-content', label: 'Message Content', detail: 'Send the message you want scheduled.' },
    { id: 'ask-webhook', label: 'Webhook Setup', detail: 'Optional custom webhook with name and avatar.' },
    { id: 'ask-recurring', label: 'Recurring', detail: 'Choose repeat frequency (none, daily, weekly, etc.).' },
    { id: 'ask-time', label: 'Send Time', detail: 'Set when the message should be delivered.' },
    { id: 'confirm', label: 'Confirmation', detail: 'All details confirmed and message queued.' },
  ];

  return (
    <ChannelDemo
      channelName="staff"
      title="See Scheduled Messages in Action"
      subtitle="Complete guided flow with webhooks and recurring options"
      timeline={TIMELINE}
      explanations={EXPLANATIONS}
    />
  );
}