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
    'Rune is the scripting language behind Fluxer tags. It runs inside every tag, so you can build anything from a one-line reply to a full embed.',
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

export const GUIDES: Guide[] = [RUNE_GUIDE];

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
