export interface GuideChapter {
  slug: string;
  title: string;
  short: string;
}

export interface Guide {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  chapters: GuideChapter[];
}

export const RUNE_GUIDE: Guide = {
  slug: 'rune',
  title: 'Rune',
  tagline: 'A scripting language for tags.',
  description:
    'Rune is the scripting language behind Functious tags. It runs inside every tag, so you can build anything from a one-line reply to a full embed.',
  chapters: [
    {
      slug: '',
      title: 'Overview',
      short: 'What Rune is and how to run your first tag.',
    },
    {
      slug: 'basics',
      title: 'Basics',
      short: 'Comments, variables, values, strings, and operators.',
    },
    {
      slug: 'control-flow',
      title: 'Control Flow',
      short: 'Conditionals, loops, and functions.',
    },
    {
      slug: 'builtins',
      title: 'Builtins',
      short: 'The full standard library reference.',
    },
    {
      slug: 'globals',
      title: 'Context',
      short: '$user, $channel, $message, $guild, and args.',
    },
    {
      slug: 'embeds',
      title: 'Embeds',
      short: 'Rich messages built with embed().',
    },
    {
      slug: 'examples',
      title: 'Examples',
      short: 'Real working tags to learn from.',
    },
  ],
};

export const REACTION_ROLES_GUIDE: Guide = {
  slug: 'reaction-roles',
  title: 'Reaction Roles',
  tagline: 'Let members self-assign roles with reactions.',
  description:
    'Set up reaction role panels so members can give themselves roles by reacting to a message.',
  chapters: [
    { slug: '', title: 'Overview', short: 'What reaction roles are and how they work.' },
    { slug: 'setup', title: 'Creating a Panel', short: 'Walk through the creation flow step by step.' },
    { slug: 'editing', title: 'Editing & Fixing', short: 'Edit an existing panel or repair broken reactions.' },
    { slug: 'exclusive', title: 'Exclusive Mode', short: 'Limit users to one role per panel.' },
  ],
};

export const MEDIA_CHANNELS_GUIDE: Guide = {
  slug: 'media-channels',
  title: 'Media Channels',
  tagline: 'Channels that only allow media or links.',
  description:
    'Restrict channels so only images, videos, files, or links get through. Add rating reactions and a persistent sticky message.',
  chapters: [
    { slug: '', title: 'Overview', short: 'What media channels do and when to use them.' },
    { slug: 'setup', title: 'Adding a Channel', short: 'Configure allowed content types.' },
    { slug: 'rating', title: 'Content Rating', short: 'Upvote/downvote reactions and auto-delete.' },
    { slug: 'sticky', title: 'Sticky Message', short: 'A message that re-posts itself after each post.' },
  ],
};

export const TEMP_CHANNELS_GUIDE: Guide = {
  slug: 'temp-channels',
  title: 'Temp Channels',
  tagline: 'Voice channels that create themselves on demand.',
  description:
    'Members join a single "Join to Create" channel and instantly get their own private voice channel. Configure names, limits, and management panels.',
  chapters: [
    { slug: '', title: 'Overview', short: 'How temp channels work.' },
    { slug: 'setup', title: 'Setup', short: 'Create the default or a configured setup.' },
    { slug: 'config', title: 'Configuration', short: 'Names, limits, counting, and custom categories.' },
    { slug: 'manage', title: 'Manage Panel', short: 'The in-channel management embed.' },
  ],
};

export const SCHEDULE_GUIDE: Guide = {
  slug: 'schedule',
  title: 'Scheduled Messages',
  tagline: 'Send messages, polls, and giveaways at a set time.',
  description:
    'Schedule text messages, rich embeds, polls, giveaways, or reminders to fire at any future time -optionally recurring.',
  chapters: [
    { slug: '', title: 'Overview', short: 'What you can schedule and how it works.' },
    { slug: 'content', title: 'Text & Embeds', short: 'Schedule a plain message or a rich embed.' },
    { slug: 'commands', title: 'Polls, Giveaways & Reminders', short: 'Schedule bot commands at a future time.' },
    { slug: 'recurring', title: 'Recurring & Webhooks', short: 'Repeat on a schedule and send as a webhook.' },
    { slug: 'managing', title: 'Managing', short: 'View, edit, and delete scheduled messages.' },
  ],
};

export const GIVEAWAY_GUIDE: Guide = {
  slug: 'giveaways',
  title: 'Giveaways',
  tagline: 'Create, delete, and reroll giveaways.',
  description: 'Run giveaways in your server with entry reactions, winner selection, and rerolls.',
  chapters: [
    { slug: '', title: 'Overview', short: 'What giveaways are and how they work.' },
    { slug: 'creating', title: 'Creating a Giveaway', short: 'The command format and all available options.' },
    { slug: 'managing', title: 'Managing Giveaways', short: 'Delete and reroll after a giveaway ends.' },
  ],
};

export const GENERAL_GUIDE: Guide = {
  slug: 'general',
  title: 'General Commands',
  tagline: 'Theme, polls, bypass roles, and more.',
  description:
    'A reference for the everyday Functious commands that do not need a dedicated guide.',
  chapters: [
    { slug: '', title: 'Overview', short: 'What is covered in this guide.' },
    { slug: 'theme', title: 'Theme', short: 'Change the bot colour, avatar, and banner.' },
    { slug: 'polls', title: 'Polls', short: 'Create and manage timed polls.' },
    { slug: 'bypass', title: 'Bypass Roles', short: 'Grant roles access to permission-locked commands.' },
    { slug: 'autoroles', title: 'Autoroles', short: 'Join roles, sticky roles, and timed roles.' },
    { slug: 'remind', title: 'Reminders', short: 'Set personal reminders from within Fluxer.' },
    { slug: 'misc', title: 'Other Commands', short: 'Prefix, language, ping, and info.' },
  ],
};

export const GUIDES: Guide[] = [
  RUNE_GUIDE,
  REACTION_ROLES_GUIDE,
  MEDIA_CHANNELS_GUIDE,
  TEMP_CHANNELS_GUIDE,
  SCHEDULE_GUIDE,
  GIVEAWAY_GUIDE,
  GENERAL_GUIDE,
];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function findChapter(guide: Guide, slug: string): GuideChapter | undefined {
  return guide.chapters.find((chapter) => chapter.slug === slug);
}

export function guideRoot(guide: Guide): string {
  return `/guides/${guide.slug}`;
}

export function chapterHref(guide: Guide, chapter: GuideChapter): string {
  return chapter.slug === '' ? guideRoot(guide) : `${guideRoot(guide)}/${chapter.slug}`;
}

export function getNeighbors(guide: Guide, slug: string): {
  prev: GuideChapter | null;
  next: GuideChapter | null;
} {
  const index = guide.chapters.findIndex((chapter) => chapter.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: guide.chapters[index - 1] ?? null,
    next: guide.chapters[index + 1] ?? null,
  };
}