const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export function extractPlaceholders(value: string): string[] {
  const matches = String(value ?? '').match(PLACEHOLDER_PATTERN) ?? [];
  return matches.map((token) => token.slice(1, -1));
}

export function placeholderError(
  baseValue: string,
  value: string,
): string | null {
  const expected = new Set(extractPlaceholders(baseValue));
  const actual = new Set(extractPlaceholders(value));

  const missing = [...expected].filter((name) => !actual.has(name));
  const unexpected = [...actual].filter((name) => !expected.has(name));

  if (missing.length === 0 && unexpected.length === 0) return null;

  const details: string[] = [];
  if (missing.length > 0) {
    details.push(`missing ${missing.map((name) => `{${name}}`).join(', ')}`);
  }
  if (unexpected.length > 0) {
    details.push(
      `unexpected ${unexpected.map((name) => `{${name}}`).join(', ')}`,
    );
  }

  return `Keep the English placeholders unchanged: ${details.join('; ')}.`;
}
