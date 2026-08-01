export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ: FaqItem[] = [
  {
    question: 'What is exclusive mode for reaction roles?',
    answer:
      'Exclusive mode (enabled with `f!roles exclusive <messageId>`) limits users to having only one role from that reaction message at a time.',
  },
  {
    question: 'Can I schedule recurring messages?',
    answer:
      'Yes! When setting up a scheduled message, you can choose `daily`, `weekly`, `monthly`, or a custom cron expression for recurring sends.',
  },
  {
    question: 'How do sticky roles work?',
    answer:
      "Sticky roles save a user's roles when they leave the server. If they rejoin, the bot automatically restores those roles. Enable with `f!autoroles sticky`.",
  },
  {
    question: 'What time formats does the reminder command support?',
    answer:
      'Reminders support natural language like "tomorrow at 5pm" or "in 30 minutes", and short-form like "1h30m", "2d", or "5m".',
  },
  {
    question: 'What is the bypass command?',
    answer:
      'Bypass lets you grant specific roles access to permission-locked commands without giving them server permissions. Use `f!bypass add <role> <commands>` or `f!bypass add <role> all`.',
  },
];
