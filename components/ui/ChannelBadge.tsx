'use client';

import type { ChannelProfile } from '@/lib/types';

function channelTypeLabel(type: number | null | undefined): string {
  switch (type) {
    case 0:
      return 'text';
    case 2:
      return 'voice';
    case 4:
      return 'category';
    case 13:
      return 'stage';
    case 15:
      return 'forum';
    case 5:
      return 'announcement';
    default:
      return 'channel';
  }
}

export default function ChannelBadge({
  channelId,
  profile,
  showId = true,
  inline = false,
  className = '',
}: {
  channelId: string;
  profile?: ChannelProfile | null;
  showId?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const name = profile?.name ?? null;
  const typeLabel = channelTypeLabel(profile?.type);

  if (inline) {
    return (
      <span className={`inline-flex items-center gap-1.5 min-w-0 ${className}`} title={channelId}>
        <span className="w-4 h-4 rounded bg-orange/10 flex items-center justify-center text-orange-warm text-[9px] font-bold flex-shrink-0">
          #
        </span>
        {name ? (
          <span className="text-white/60 text-xs truncate">{name}</span>
        ) : (
          <span className="text-white/40 font-mono text-xs truncate">{channelId}</span>
        )}
        {name && showId && (
          <span className="text-white/25 text-[10px] font-mono shrink-0">{channelId}</span>
        )}
        <span className="sr-only">{typeLabel}</span>
      </span>
    );
  }

  return (
    <span
      className={`flex items-center gap-1.5 min-w-0 ${className}`}
      title={channelId}
    >
      <span className="w-5 h-5 rounded bg-orange/10 flex items-center justify-center text-orange-warm text-xs font-bold flex-shrink-0">
        #
      </span>
      {name ? (
        <>
          <span className="text-white/85 text-sm font-medium truncate leading-tight">{name}</span>
          {showId && (
            <span className="text-[11px] text-white/25 font-mono truncate">{channelId}</span>
          )}
        </>
      ) : (
        <span className="text-white/40 font-mono text-sm truncate leading-tight">{channelId}</span>
      )}
    </span>
  );
}