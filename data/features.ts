import type { Category } from './commands';

export interface FeatureData {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  capabilities: string[];
  usageExamples: string[];
  relatedCommands: string[];
  relatedGuides?: string[];
  category: Category;
}

export const FEATURES: FeatureData[] = [
  {
    slug: 'reaction-roles',
    name: 'Reaction Roles',
    shortDescription: 'Let users self-assign roles by reacting to a message with emojis.',
    fullDescription:
      'Reaction roles allow server members to pick their own roles via reactions. Create a message with {role:Name} tags, react with emojis to map each tag, and members can instantly self-assign roles by reacting. Supports exclusive mode, DM notifications, and easy editing or fixing.',
    capabilities: [
      'Maximum amount of emojis on messages',
      'Custom emoji support',
      'Exclusive mode (limit to one role per user)',
      'DM notifications when roles are added/removed',
      'Easy edit, delete, and reaction-fix commands',
    ],
    usageExamples: [
      'f!roles create #channel',
      'f!roles exclusive <messageId>',
      'f!roles edit <messageId>',
    ],
    relatedCommands: ['roles'],
    category: 'roles',
  },
  {
    slug: 'giveaways',
    name: 'Giveaways',
    shortDescription: 'Run reaction-based giveaways with automatic winner selection.',
    fullDescription:
      'Host giveaways with reaction entry, timed end dates, and configurable winner count. Members react with 🎉 to enter, and the bot automatically selects and announces winners when the timer expires. Reroll any giveaway if a winner is ineligible.',
    capabilities: [
      'Up to 50 winners per giveaway',
      'Custom requirements (e.g., role or server booster)',
      'Reroll winners',
    ],
    usageExamples: [
      'f!giveaway 20m | 3 | A t-shirt',
      'f!giveaway 1h | 1 | Nitro | channel:#giveaways',
      'f!giveaway reroll <messageId> | 2',
    ],
    relatedCommands: ['giveaway'],
    category: 'giveaways-polls',
  },
  {
    slug: 'polls',
    name: 'Polls',
    shortDescription: 'Create visual bar-chart polls with up to 10 options.',
    fullDescription:
      'Polls generate real-time bar-chart images as users vote. Supports 2–10 options, timed end dates, and automatically displays results when the poll closes. Perfect for community decisions and server feedback.',
    capabilities: [
      'Live-updating bar charts',
      'Up to 10 options',
      'Visual result embed',
    ],
    usageExamples: [
      "f!polls 5m | What's your favorite color? | Red | Blue | Green",
      'f!polls 1h | Best feature? | Giveaways | Polls | Roles | Tags',
    ],
    relatedCommands: ['polls'],
    category: 'giveaways-polls',
  },
  {
    slug: 'tags',
    name: 'Tags',
    shortDescription: 'Store and quickly send reusable text or embed messages.',
    fullDescription:
      'Tags are custom reusable messages for FAQs, server rules, or announcements. Create a tag once and send it instantly by name at any time. Supports plain text, embeds, or Rune scripts To learn more, click the related Guide above.',
    capabilities: [
      'Text or embed format',
      'Up to 50 tags per server',
      'Edit tag content, name, or type',
      'View tag stats (uses, creation date)',
    ],
    usageExamples: [
      'f!tags add rules text Be respectful and follow Fluxer TOS.',
      'f!tags rules',
      'f!tags edit rules',
      'f!tags list',
    ],
    relatedCommands: ['tags'],
    relatedGuides: ['rune'],
    category: 'utility',
  },
  {
    slug: 'scheduled-messages',
    name: 'Scheduled Messages',
    shortDescription: 'Schedule messages, embeds, polls, or giveaways to send later.',
    fullDescription:
      'Schedule text, embeds, polls, giveaways, or reminders to send at a future time. Supports recurring schedules with daily, weekly, monthly, or custom cron expressions, webhook delivery, and dynamic templates with variables.',
    capabilities: [
      'Text and embed scheduling',
      'Recurring schedules (daily, weekly, monthly, cron)',
      'Webhook support (custom name and avatar)',
      'Dynamic templates ({user}, {server}, {time}, {count}, math, conditionals)',
      'Up to 10 scheduled messages per server',
    ],
    usageExamples: [
      'f!schedule content #announcements',
      'f!schedule embed #updates',
      'f!schedule poll 5m | Question? | Opt1 | Opt2',
      'f!schedule view',
      'f!schedule delete 2',
    ],
    relatedCommands: ['schedule'],
    category: 'scheduling',
  },
  {
    slug: 'reminders',
    name: 'Reminders',
    shortDescription: 'Set personal reminders delivered in the channel or via DM.',
    fullDescription:
      'Reminders let you schedule a message to yourself at a future time. Supports natural language input like "tomorrow at 5pm" as well as short-form syntax. Delivered in the channel or as a DM.',
    capabilities: [
      'Natural language time parsing (e.g., "tomorrow at 5pm")',
      'Short-form time syntax (e.g., "1h30m", "2d")',
      'Up to 25 reminders per user',
      'Guild or DM delivery',
    ],
    usageExamples: [
      'f!remind in 30 minutes Take a break',
      'f!remind dm tomorrow at 5pm Call mom',
      'f!remind list',
      'f!remind delete 1',
    ],
    relatedCommands: ['remind'],
    category: 'scheduling',
  },
  {
    slug: 'temporary-channels',
    name: 'Temporary Channels',
    shortDescription: 'Auto-create and delete temporary voice channels as users join/leave.',
    fullDescription:
      'Temporary channels create user-owned voice channels on-demand when someone joins a designated "Join To Create" channel. The channel is automatically deleted when all members leave, keeping your server clean and organised.',
    capabilities: [
      'Join-to-create voice channel',
      'Custom channel names with numbering',
      'User limit configuration',
      'Optional custom category',
      'Channel owner management controls',
    ],
    usageExamples: [
      'f!tempchannels setup',
      'f!tempchannels config {name:My Channel} {limit:5} {counting:on}',
      'f!tempchannels reset default',
    ],
    relatedCommands: ['tempchannels'],
    category: 'server-management',
  },
  {
    slug: 'timezone-converter',
    name: 'Timezone Converter',
    shortDescription: 'Automatically convert time mentions to Fluxer timestamps.',
    fullDescription:
      'Timezone converter watches for time mentions in messages and offers to convert them to Fluxer timestamps that each user sees in their own local timezone. Each member sets their own timezone and the bot handles the rest.',
    capabilities: [
      'Per-user timezone settings',
      'Automatic time detection',
      'Webhook-based timestamp resending',
      'Toggle on/off for the server',
      'View user timezone info',
    ],
    usageExamples: [
      'f!timezone toggle',
      'f!timezone set America/New_York',
      'f!timezone view @user',
      'f!timezone remove',
    ],
    relatedCommands: ['timezone'],
    category: 'utility',
  },
  {
    slug: 'auto-roles',
    name: 'Auto Roles',
    shortDescription: 'Automatically assign roles to users on join or after a delay.',
    fullDescription:
      'Auto roles let you configure join roles, sticky roles, and timed roles for your server. Join roles are applied instantly on member join, sticky roles are restored if a user rejoins, and timed roles are applied after a configurable duration.',
    capabilities: [
      'Join roles (applied on server join)',
      'Sticky roles (restored if user leaves and rejoins)',
      'Timed roles (applied after X time in server)',
      'Up to 20 join roles',
      'Time format: 1w3d2h5m',
    ],
    usageExamples: [
      'f!autoroles join add Member, Updates',
      'f!autoroles sticky',
      'f!autoroles timed add Verified {time:10m}',
      'f!autoroles view',
    ],
    relatedCommands: ['autoroles'],
    category: 'server-management',
  },
  {
    slug: 'bypass',
    name: 'Bypass',
    shortDescription: 'Grant roles permission to use commands without server permissions.',
    fullDescription:
      'Bypass allows you to give specific roles access to permission-locked commands without granting them full server permissions. Ideal for giving moderators access to bot commands without elevating their Fluxer permissions.',
    capabilities: [
      'Bypass individual commands or all commands',
      'Up to 15 bypassed roles',
      'Role-based command access control',
    ],
    usageExamples: [
      'f!bypass add Moderator roles, schedule',
      'f!bypass add Admin all',
      'f!bypass view',
      'f!bypass remove Moderator',
    ],
    relatedCommands: ['bypass'],
    category: 'server-management',
  },
];

