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
    usage: 'bypass <add|remove|edit|view> [role] [commands]',
    aliases: [],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'giveaway',
    description: 'Create and manage giveaways with reaction-based entry.',
    usage: 'giveaway <time> | <winners> | <prize> [| channel:<#channel>] [| requirement]',
    aliases: ['gw'],
    cooldown: 5000,
    permissions: 'Manage Guild',
    category: 'giveaways-polls',
  },
  {
    name: 'help',
    description: 'Display the help menu or info about a specific command.',
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
    name: 'ping',
    description: 'Show gateway, database, and round-trip latency.',
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
    description: 'View or change the bot command prefix for your server.',
    usage: 'prefix [change <new_prefix>]',
    aliases: [],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'remind',
    description: 'Set a reminder to be delivered in the channel or via DM.',
    usage: 'remind <time> <message> | remind dm <time> <message>',
    aliases: ['reminder', 're', 'reminders'],
    cooldown: 2500,
    permissions: null,
    category: 'scheduling',
  },
  {
    name: 'roles',
    description: 'Setup and manage reaction role messages for your server.',
    usage: 'roles <help|create|edit|view|delete|fix|dm|exclusive> [options]',
    aliases: ['reactionroles', 'reactions', 'reactroles', 'reactionrole', 'rr'],
    cooldown: 7000,
    permissions: 'Manage Guild',
    category: 'roles',
  },
  {
    name: 'schedule',
    description: 'Schedule messages, polls, giveaways, or reminders at a specific time.',
    usage: 'schedule <content|embed|poll|giveaway|remind|view|edit|delete|stop> [options]',
    aliases: ['sched', 'scheduler'],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'scheduling',
  },
  {
    name: 'tags',
    description: 'Create and manage reusable text or embed tags for quick sending.',
    usage: 'tags <help|add|remove|edit|view|list> [name] [type] [content]',
    aliases: ['tag'],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'utility',
  },
  {
    name: 'tempchannels',
    description: 'Setup dynamic temporary voice channels with a join-to-create system.',
    usage: 'tempchannels <help|setup|config|edit|delete|view|reset> [options]',
    aliases: [],
    cooldown: 3000,
    permissions: 'Manage Guild',
    category: 'server-management',
  },
  {
    name: 'timezone',
    description: 'Enable automatic timezone conversion for time mentions in messages.',
    usage: 'timezone <toggle|set <timezone>|remove|view [user]>',
    aliases: [],
    cooldown: 3000,
    permissions: 'Manage Guild (for toggle)',
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
