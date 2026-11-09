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
      'Reaction roles allow community members to pick their own roles via reactions. Create a message with {role:Name} tags, react with emojis to map each tag, and members can instantly self-assign roles by reacting. Supports exclusive mode, DM notifications, and easy editing or fixing.',
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
    relatedGuides: ['reaction-roles'],
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
      'Custom requirements (e.g., role or community booster)',
      'Reroll winners',
    ],
    usageExamples: [
      'f!giveaway 20m | 3 | A t-shirt',
      'f!giveaway 1h | 1 | Plutonium | channel:#giveaways',
      'f!giveaway reroll <messageId> | 2',
    ],
    relatedCommands: ['giveaway'],
    relatedGuides: ['giveaways'],
    category: 'giveaways-polls',
  },
  {
    slug: 'polls',
    name: 'Polls',
    shortDescription: 'Create visual bar-chart polls with up to 10 options.',
    fullDescription:
      'Polls generate real-time bar-chart images as users vote. Supports 2–10 options, timed end dates, and automatically displays results when the poll closes. Perfect for community decisions and member feedback.',
    capabilities: [
      'Live-updating bar charts',
      'Up to 10 options',
      'Visual result embed',
    ],
    usageExamples: [
      "f!polls 5m | What's your favorite color? | Red | Blue | Green",
      'f!polls thread 1h | Best feature? | Giveaways | Polls | Roles | Tags',
    ],
    relatedCommands: ['polls'],
    relatedGuides: ['general/polls'],
    category: 'giveaways-polls',
  },
  {
    slug: 'tags',
    name: 'Tags',
    shortDescription: 'Store and quickly send reusable text or embed messages.',
    fullDescription:
      'Tags are custom reusable messages for FAQs, community rules, or announcements. Create a tag once and send it instantly by name at any time. Supports plain text, embeds, or Rune scripts To learn more, click the related Guide above.',
    capabilities: [
      'Text or embed format',
      'Up to 50 tags per community',
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
      'Up to 10 scheduled messages per community',
    ],
    usageExamples: [
      'f!schedule content #announcements',
      'f!schedule embed #updates',
      'f!schedule poll 5m | Question? | Opt1 | Opt2',
      'f!schedule view',
      'f!schedule delete 2',
    ],
    relatedCommands: ['schedule'],
    relatedGuides: ['schedule'],
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
    relatedGuides: ['general/remind'],
    category: 'scheduling',
  },
  {
    slug: 'temporary-channels',
    name: 'Temporary Channels',
    shortDescription: 'Auto-create and delete temporary voice channels as users join/leave.',
    fullDescription:
      'Temporary channels create user-owned voice channels on-demand when someone joins a designated "Join To Create" channel. The channel is automatically deleted when all members leave, keeping your community clean and organised.',
    capabilities: [
      'Join-to-create voice channel',
      'Custom channel names with numbering',
      'User limit configuration',
      'Optional custom category',
      'Channel owner management controls',
    ],
    usageExamples: [
      'f!tc set default',
      'f!tc set config {name:My Channel} {limit:5} {counting}',
      'f!tc set config {reset}',
    ],
    relatedCommands: ['tempchannels'],
    relatedGuides: ['temp-channels'],
    category: 'server-management',
  },
  {
    slug: 'media-channels',
    name: 'Media Channels',
    shortDescription: "Turn any channel into a media-only zone that filters messages by content type.",
    fullDescription:
      "Media channels silently delete anything that isn't content you allow, keeping image, video, and link channels clean without anyone needing to run a moderation command. Choose which types get through, optionally add rating reactions that auto-delete downvoted posts, and pin a rules reminder that re-posts itself after every new upload.",
    capabilities: [
      'Filter by attachment type: images, videos, files, links, or any attachment',
      'Every attachment must pass, so mixed messages are caught too',
      'Rating reactions that auto-delete posts past a downvote threshold',
      'Sticky rules message that re-posts itself after each new post',
      'Custom sticky text, or a default generated from your allowed types',
      'Edit, remove, and list configured channels',
    ],
    usageExamples: [
      'f!mc add #media',
      'f!mc add #media --images --rating',
      'f!mc add #media --videos --links --sticky --stickytext No spoilers please!',
      'f!mc edit #media --images --delete 3',
      'f!mc list',
    ],
    relatedCommands: ['mediachannels'],
    relatedGuides: ['media-channels'],
    category: 'server-management',
  },
  {
    slug: 'forms',
    name: 'Forms',
    shortDescription: 'Build private application forms with an interactive editor and a reviewer workflow.',
    fullDescription:
      'Forms lets you setup any kind of form application in your community. Members start from a panel reaction, answer in DMs, and submissions arrive in a private review channel where reviewers can accept or decline with a reason.',
    capabilities: [
      'Interactive Form Menu with section and question pagination',
      'Short text, paragraph, and multiple-choice questions',
      'Private DM submissions with validation and draft resume',
      'Panel and review channels, reviewer roles, and required-role access',
      'Cooldowns, per-member submission limits, multiple submissions, and anonymous review',
      'Custom panel emoji, color, image, and message templates',
      'Up to 25 forms per community and 50 questions per form',
    ],
    usageExamples: [
      'f!forms setup',
      'f!forms create StaffApp',
      'f!forms edit StaffApp',
      'f!forms question add StaffApp text | Why do you want to join?',
      'f!forms open StaffApp',
      'f!forms panel StaffApp',
    ],
    relatedCommands: ['forms'],
    relatedGuides: ['forms'],
    category: 'server-management',
  },
  {
    slug: 'events',
    name: 'Events',
    shortDescription: 'Create community events with RSVP reactions, capacity limits, and automatic reminders.',
    fullDescription:
      'Events lets staff schedule a community event once and handle the whole RSVP flow from a single message. Members choose Going, Maybe, or Declined with reactions, while the event message keeps live counts, capacity, and waitlists up to date. Reminders, recurring schedules, and dashboard management are included.',
    capabilities: [
      'Guided setup or one-line creation with f!events create',
      'Going, Maybe, and Declined RSVP reactions with live counts',
      'Capacity limits with automatic waitlists',
      'Automatic reminders before each event',
      'Daily, weekly, and monthly recurrence with an optional end date',
      'Custom channels, colors, images, and message templates',
      'Up to 25 events per community, managed from Fluxer or the dashboard',
    ],
    usageExamples: [
      'f!events setup',
      'f!events create Movie Night | tomorrow at 8pm | channel:#events',
      'f!events list upcoming',
      'f!events view <messageId>',
      'f!events who <messageId>',
      'f!events remind <messageId> 1h',
    ],
    relatedCommands: ['events'],
    relatedGuides: ['events'],
    category: 'scheduling',
  },
  {
    slug: 'stickies',
    name: 'Sticky Messages',
    shortDescription: 'Keep important messages at the bottom of a channel as new messages arrive.',
    fullDescription:
      'Sticky messages keep a note, embed, or Rune script at the bottom of a channel. Whenever a new message pushes it up, the bot reposts it automatically. Each sticky can have its own delay and mention policy, and staff can edit, move, pause, refresh, or remove it without recreating the channel.',
    capabilities: [
      'Plain text, embed, or Rune script stickies',
      'Automatic reposting with a configurable delay',
      'Mention controls: none, users, roles, or everyone',
      'Edit, change type, move channels, pause, refresh, or delete',
      'Up to 10 stickies per community, one per channel',
      'Full management from the dashboard',
    ],
    usageExamples: [
      'f!sticky create #rules',
      'f!sticky list',
      'f!sticky edit 1',
      'f!sticky type 1 embed',
      'f!sticky delay 1 10',
      'f!sticky mentions 1 none',
    ],
    relatedCommands: ['sticky'],
    relatedGuides: ['stickies'],
    category: 'utility',
  },
  {
    slug: 'server-checkups',
    name: 'Server Checkups',
    shortDescription: 'Run a guided health check across your community setup in one command.',
    fullDescription:
      'Server checkups review the parts of a community that most often break silently: bot access, roles, reaction roles, channels, forms, and recent activity. Each check reports pass, warning, failure, or skipped with a plain-language explanation, followed by a summary and next steps. The same checks are available from the dashboard.',
    capabilities: [
      'Checks bot access and Manage Guild permissions',
      'Reviews role hierarchy and reaction role setup',
      'Verifies channel access for configured features',
      'Checks form settings and review channels',
      'Flags inactive or unreachable community activity',
      'Live progress with pass, warning, failure, and skipped results',
      'Runs from Fluxer or the dashboard configuration page',
    ],
    usageExamples: [
      'f!checkup',
      'f!launchpad',
      'f!health',
    ],
    relatedCommands: ['checkup'],
    category: 'server-management',
  },
  {
    slug: 'command-policies',
    name: 'Command Policies',
    shortDescription: 'Disable commands, restrict where they run, add cooldowns, or clean up after them.',
    fullDescription:
      'Command policies give staff per-command control without changing Fluxer permissions. Use the interactive f!policy editor or the dashboard to disable a command, limit it to specific channels or roles, add a cooldown, and automatically delete the command trigger message. Disabled commands are marked in the help menu.',
    capabilities: [
      'Enable or disable each configurable command',
      'Restrict commands to allowed channels or roles',
      'Set a per-command cooldown',
      'Automatically delete the command trigger message',
      'Interactive editor with a summary of active rules',
      'Dashboard configuration alongside the rest of your settings',
    ],
    usageExamples: [
      'f!policy',
      'f!policy polls',
      'f!policy giveaway',
      'f!policy tags',
    ],
    relatedCommands: ['policy'],
    relatedGuides: ['policies'],
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
      'Toggle on/off for the community',
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
    slug: 'birthday',
    name: 'Birthdays & Anniversaries',
    shortDescription: "Celebrate member birthdays and your community's anniversary with automatic announcements.",
    fullDescription:
      'Birthdays stores member birthdays and your community\'s founding date, then announces each automatically with the right timezone and wording. Members opt in per community, can keep their age private, and can be given a birthday role that is removed a day later. Staff choose the announcement channel and wording, configure a community anniversary, or blacklist members who would rather not be listed.',
    capabilities: [
      'Automatic birthday announcements at midnight in each member\'s own timezone',
      'Flexible date input ("12th of June", "June 12", "6/12")',
      'Per-community opt-in, so members pick which communities see their birthday',
      'Optional age, announced as an ordinal like "31st birthday"',
      'Birthday role granted automatically and removed 24 hours later',
      'Custom announcement text with {user} and {age} placeholders',
      'Community anniversary announcements from your founding date, with an optional year',
      'Separate channel, ping role, timezone, and custom message for community anniversaries',
      'Preview the announcement, force one early, or enable and disable community celebrations',
    ],
    usageExamples: [
      'f!bday set 12th of June',
      'f!bday age 30',
      'f!bday enable',
      'f!bday preview',
      'f!bday channel #birthdays',
      'f!bday server set 12th of June 2020',
      'f!bday server channel #announcements',
      'f!bday server preview',
    ],
    relatedCommands: ['birthday'],
    category: 'utility',
  },
  {
    slug: 'auto-roles',
    name: 'Auto Roles',
    shortDescription: 'Automatically assign roles to users on join or after a delay.',
    fullDescription:
      'Auto roles let you configure join roles, sticky roles, and timed roles for your community. Join roles are applied instantly on member join, sticky roles are restored if a user rejoins, and timed roles are applied after a configurable duration.',
    capabilities: [
      'Join roles (applied when someone joins the community)',
      'Sticky roles (restored if user leaves and rejoins)',
      'Timed roles (applied after X time in the community)',
      'Up to 20 join roles',
      'Time format: 6d12h30m',
    ],
    usageExamples: [
      'f!autoroles join add Member, Updates',
      'f!autoroles sticky',
      'f!autoroles timed add Verified {time:10m}',
      'f!autoroles view',
    ],
    relatedCommands: ['autoroles'],
    relatedGuides: ['general/autoroles'],
    category: 'server-management',
  },
  {
    slug: 'bypass',
    name: 'Bypass',
    shortDescription: 'Grant roles permission to use commands without community permissions.',
    fullDescription:
      'Bypass allows you to give specific roles access to permission-locked commands without granting them full community permissions. Ideal for giving moderators access to bot commands without elevating their Fluxer permissions.',
    capabilities: [
      'Bypass individual commands or all commands',
      'Up to 15 bypassed roles',
      'Role-based command access control',
    ],
    usageExamples: [
      'f!bypass add Moderator | roles, schedule',
      'f!bypass add Admin | all',
      'f!bypass view',
      'f!bypass remove Moderator',
    ],
    relatedCommands: ['bypass'],
    relatedGuides: ['general/bypass'],
    category: 'server-management',
  },
];

