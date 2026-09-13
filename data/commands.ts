export type Category =
  | 'roles'
  | 'giveaways-polls'
  | 'scheduling'
  | 'utility'
  | 'server-management';

export interface CommandEntry {
  name: string;
  description: string;
  usage: string;
  aliases: string[];
  cooldown: number;
  permissions: string | null;
  category: Category;
}

export const COMMANDS: CommandEntry[] = [
  {
    name: 'autoroles',
    description: 'Setup autoroles in your server such as join roles or sticky roles.',
    usage: 'autoroles <help|view|sticky|join add/remove [roles]|timed add/remove [roles] {time:X}>',
    aliases: ['autorole', 'ar'],
    cooldown: 2000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'bypass',
    description: 'Grant roles a bypass to use commands locked behind permissions.',
    usage: 'bypass <add|remove|edit|view> [role] | [commands]',
    aliases: ['bp'],
    cooldown: 2000,
    permissions: 'Administrator',
    category: 'server-management',
  },
  {
    name: 'giveaway',
    description: 'Create, delete, and reroll giveaways with reaction-based entry.',
    usage: 'giveaway <time> | <winners> | <prize> [| channel:<#channel>] [| dm:yes] [| ping:no] [| multiwin:yes] [| image:<url>] [| requirement]',
    aliases: ['gw'],
    cooldown: 5000,
    permissions: 'Manage Guild',
    category: 'giveaways-polls',
  },
  {
    name: 'help',
    description: 'Display the help menu or detailed info about a specific command.',
    usage: 'help [command]',
    aliases: ['h'],
    cooldown: 3000,
    permissions: null,
    category: 'utility',
  },
  {
    name: 'info',
    description: 'Show bot statistics, uptime, latency, and library info.',
    usage: 'info',
    aliases: ['stats', 'botinfo', 'bi'],
    cooldown: 15000,
    permissions: null,
    category: 'utility',
  },
  {
    name: 'language',
    description: 'Change the bot response language for your server.',
    usage: 'language [language_code]',
    aliases: ['lang'],
    cooldown: 5000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'mediachannels',
    description: 'Restrict channels to media or links only, with optional rating reactions and sticky messages.',
    usage: 'mediachannels <add|edit|remove|list> [#channel] [--images] [--videos] [--files] [--links] [--rating] [--delete N] [--sticky] [--stickytext text]',
    aliases: ['mediachannel', 'mc', 'mediachan'],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'ping',
    description: 'Show gateway, database, and memory latency.',
    usage: 'ping',
    aliases: ['p'],
    cooldown: 4500,
    permissions: null,
    category: 'utility',
  },
  {
    name: 'polls',
    description: 'Create visual bar-chart polls with up to 10 options.',
    usage: 'polls <time> | <question> | <option1> | <option2> [| more options...]',
    aliases: ['poll'],
    cooldown: 7000,
    permissions: null,
    category: 'giveaways-polls',
  },
  {
    name: 'prefix',
    description: 'Change the bot command prefix for your server (max 8 characters).',
    usage: 'prefix <new_prefix>',
    aliases: [],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'remind',
    description: 'Set a personal reminder delivered in the channel or via DM.',
    usage: 'remind [dm] <time> <message>',
    aliases: ['reminder', 're', 'reminders'],
    cooldown: 2500,
    permissions: null,
    category: 'scheduling',
  },
  {
    name: 'roles',
    description: 'Setup and manage reaction role panels for your server.',
    usage: 'roles <help|create|edit|view|delete|fix|dm|exclusive|stop> [options]',
    aliases: ['reactionroles', 'reactions', 'reactroles', 'reactionrole', 'rr'],
    cooldown: 7000,
    permissions: 'Manage Guild',
    category: 'roles',
  },
  {
    name: 'schedule',
    description: 'Schedule messages, embeds, polls, giveaways, or reminders to send at a future time.',
    usage: 'schedule <content|embed|poll|giveaway|remind|view|edit|delete|stop> [#channel] [options]',
    aliases: ['sched', 'scheduler'],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'scheduling',
  },
  {
    name: 'tags',
    description: 'Create and use reusable text, embed, or Rune script tags.',
    usage: 'tags <help|add|remove|edit|view|list> [name] [type] [content]',
    aliases: ['tag'],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'utility',
  },
  {
    name: 'tempchannels',
    description: 'Setup temporary voice channels that create and delete themselves on demand.',
    usage: 'tempchannels <help|set default|set config|edit|delete|view> [options]',
    aliases: ['tc', 'tempchannel'],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'theme',
    description: 'Change the bot avatar, banner, and embed colour for your server.',
    usage: 'theme <color|default>',
    aliases: [],
    cooldown: 15000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'timezone',
    description: 'Enable timezone conversion for time mentions, and set your personal timezone.',
    usage: 'timezone <toggle|set <timezone>|remove|view [user]>',
    aliases: ['tz'],
    cooldown: 2000,
    permissions: null,
    category: 'utility',
  },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  roles: 'Roles',
  'giveaways-polls': 'Giveaways & Polls',
  scheduling: 'Scheduling',
  utility: 'Utility',
  'server-management': 'Server Management',
};
