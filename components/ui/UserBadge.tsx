'use client';

import Image from 'next/image';
import type { UserProfile } from '@/lib/types';

function avatarSrc(
  userId: string,
  avatar: string | null,
  avatarUrl: string | null,
  size: number,
): string | null {
  if (avatarUrl) return avatarUrl;
  if (!avatar) return null;
  const ext = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://fluxerusercontent.com/avatars/${userId}/${avatar}.${ext}?size=${size}`;
}

function isGif(src: string): boolean {
  return src.includes('.gif') || src.endsWith('.gif');
}

function initials(name: string | null, userId: string): string {
  const base = name || userId;
  return base
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function UserBadge({
  userId,
  profile,
  size = 'md',
  showId = true,
  inline = false,
  className = '',
}: {
  userId: string;
  profile?: UserProfile | null;
  size?: 'sm' | 'md';
  showId?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const px = inline ? 20 : size === 'sm' ? 24 : 32;
  const dims = inline
    ? 'w-5 h-5 text-[8px]'
    : size === 'sm'
      ? 'w-6 h-6 text-[9px]'
      : 'w-8 h-8 text-[10px]';
  const name = profile?.globalName ?? profile?.username ?? null;
  const src = profile ? avatarSrc(profile.id, profile.avatar, profile.avatarUrl, px) : null;

  if (inline) {
    return (
      <div className={`flex items-center gap-1.5 min-w-0 ${className}`} title={userId}>
        {src ? (
          <Image
            src={src}
            alt={name ?? userId}
            width={px}
            height={px}
            className="rounded-full flex-shrink-0"
            unoptimized={isGif(src)}
          />
        ) : (
          <div
            className={`${dims} rounded-full bg-orange/20 flex items-center justify-center text-orange-warm font-bold flex-shrink-0`}
          >
            {initials(name, userId)}
          </div>
        )}
        {name ? (
          <span className="text-white/60 text-xs truncate">{name}</span>
        ) : (
          <span className="text-white/40 font-mono text-xs truncate">{userId}</span>
        )}
        {name && showId && (
          <span className="text-white/25 text-[10px] font-mono shrink-0">{userId}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`} title={userId}>
      {src ? (
        <Image
          src={src}
          alt={name ?? userId}
          width={px}
          height={px}
          className="rounded-full flex-shrink-0"
          unoptimized={isGif(src)}
        />
      ) : (
        <div
          className={`${dims} rounded-full bg-orange/20 flex items-center justify-center text-orange-warm font-bold flex-shrink-0`}
        >
          {initials(name, userId)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {name ? (
          <>
            <p className="text-white/85 text-sm truncate leading-tight">{name}</p>
            {showId && (
              <p className="text-[11px] text-white/25 font-mono truncate mt-0.5">{userId}</p>
            )}
          </>
        ) : (
          <p className="text-white/40 font-mono text-sm truncate leading-tight">{userId}</p>
        )}
      </div>
    </div>
  );
}