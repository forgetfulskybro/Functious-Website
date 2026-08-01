import type { Category, CommandEntry } from '@/data/commands';

export function filterCommands(
  commands: CommandEntry[],
  search: string,
  category: Category | 'all'
): CommandEntry[] {
  const term = search.trim().toLowerCase();

  return commands.filter((cmd) => {
    if (category !== 'all' && cmd.category !== category) {
      return false;
    }

    if (term.length > 0) {
      const matchesName = cmd.name.toLowerCase().includes(term);
      const matchesDescription = cmd.description.toLowerCase().includes(term);
      const matchesAlias = cmd.aliases.some((alias) =>
        alias.toLowerCase().includes(term)
      );

      if (!matchesName && !matchesDescription && !matchesAlias) {
        return false;
      }
    }

    return true;
  });
}

export function formatCooldown(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds}s`;
}
