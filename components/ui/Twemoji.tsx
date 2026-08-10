import twemoji from 'twemoji';

const TWEMOJI_BASE =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/';

export function twemojiUrl(emoji: string): string | null {
  if (!emoji) return null;

  const parsed = twemoji.parse(emoji, {
    base: TWEMOJI_BASE,
    folder: 'svg',
    ext: '.svg',
  });

  const match = parsed.match(/src="([^"]+)"/);
  return match?.[1] ?? null;
}

export function isUnicodeEmoji(value: string): boolean {
  if (!value) return false;
  if (
    value.startsWith('<:') ||
    value.startsWith('<a:') ||
    value.startsWith('http')
  ) {
    return false;
  }
  return true;
}

export function TwemojiImg({
  emoji,
  size = 22,
  className = '',
}: {
  emoji: string;
  size?: number;
  className?: string;
}) {
  const src = twemojiUrl(emoji);

  if (!src) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={emoji}
      width={size}
      height={size}
      draggable={false}
      className={`block object-contain ${className}`}
      style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
    />
  );
}