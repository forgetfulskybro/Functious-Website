'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { EmojiPicker } from 'frimousse';
import { isUnicodeEmoji, TwemojiImg } from './Twemoji';

export interface CustomEmoji {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}

interface ReactionSelectProps {
  value: string;
  onChange: (emoji: string) => void;
  customEmojis?: CustomEmoji[];
  hiddenEmojis?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ReactionSelect({
  value,
  onChange,
  customEmojis = [],
  hiddenEmojis = [],
  placeholder = 'Emoji picker',
  disabled,
  className = '',
}: ReactionSelectProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'emoji' | 'custom'>('emoji');
  const [customQuery, setCustomQuery] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const hiddenSet = useMemo(() => new Set(hiddenEmojis.filter(Boolean)), [hiddenEmojis]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const width = 380;
      let left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
      setCoords({ top: rect.bottom + 6, left });
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById('reaction-select-panel');
      if (panel?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) setCustomQuery('');
  }, [open]);

  function select(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  const filteredCustom = useMemo(() => {
    const q = customQuery.trim().toLowerCase();
    return customEmojis.filter((ce) => {
      if (
        hiddenSet.has(ce.id) ||
        hiddenSet.has(ce.name) ||
        hiddenSet.has(`<:${ce.name}:${ce.id}>`) ||
        hiddenSet.has(`<a:${ce.name}:${ce.id}>`)
      ) {
        return false;
      }
      if (!q) return true;
      return ce.name.toLowerCase().includes(q) || ce.id.includes(q);
    });
  }, [customEmojis, customQuery, hiddenSet]);

  const isCustomImage =
    value.startsWith('http') ||
    value.includes('fluxerusercontent') ||
    value.startsWith('<:') ||
    value.startsWith('<a:');

  const panel =
    open &&
    coords &&
    createPortal(
      <div
        id="reaction-select-panel"
        className="fixed w-[380px] rounded-xl bg-[#1a0e0e] border border-white/10 shadow-2xl overflow-hidden"
        style={{ top: coords.top, left: coords.left, zIndex: 99 }}
      >
        <div className="relative flex">
          <button
            type="button"
            onClick={() => setTab('emoji')}
            className={[
              'flex-1 px-3 py-2 text-xs font-medium transition-colors duration-150',
              tab === 'emoji' ? 'text-orange-warm' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            Emoji
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={[
              'flex-1 px-3 py-2 text-xs font-medium transition-colors duration-150',
              tab === 'custom' ? 'text-orange-warm' : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            Custom
            {customEmojis.length > 0 && (
              <span className="ml-1 text-white/25">({customEmojis.length})</span>
            )}
          </button>
          <span
            className="absolute bottom-0 h-0.5 bg-orange transition-all duration-200 ease-out"
            style={{
              left: tab === 'emoji' ? '0%' : '50%',
              width: '50%',
            }}
          />
          <span className="absolute bottom-0 left-0 right-0 h-px bg-white/5 -z-[1]" />
        </div>

        <div className="relative h-[240px]">
          <div
            className={[
              'absolute inset-0 transition-opacity duration-150',
              tab === 'emoji' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
            ].join(' ')}
            aria-hidden={tab !== 'emoji'}
          >
            <EmojiPicker.Root
              className="isolate flex h-full w-full flex-col"
              columns={11}
              onEmojiSelect={({ emoji }) => {
                if (hiddenSet.has(emoji)) return;
                select(emoji);
              }}
            >
              <EmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange" />
              <EmojiPicker.Viewport className="relative flex-1 outline-none">
                <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
                  Loading…
                </EmojiPicker.Loading>
                <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
                  No emoji found.
                </EmojiPicker.Empty>
                <EmojiPicker.List
                  className="select-none pb-1.5 w-full"
                  components={{
                    CategoryHeader: ({ category, ...props }) => (
                      <div
                        className="sticky top-0 z-[1] bg-[#1a0e0e] px-3 pt-2 pb-1 font-medium text-white/40 text-[10px] uppercase tracking-widest"
                        {...props}
                      >
                        {category.label}
                      </div>
                    ),
                    Row: ({ children, ...props }) => (
                      <div className="scroll-my-1 px-1.5 flex w-full" {...props}>
                        {children}
                      </div>
                    ),
                    Emoji: ({ emoji, ...props }) => {
                      if (hiddenSet.has(emoji.emoji)) {
                        return <span className="size-8 shrink-0" aria-hidden />;
                      }
                      return (
                        <button
                          type="button"
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-lg hover:bg-white/10 data-[active]:bg-orange/20"
                          {...props}
                        >
                          <TwemojiImg emoji={emoji.emoji} size={22} />
                        </button>
                      );
                    },
                  }}
                />
              </EmojiPicker.Viewport>
            </EmojiPicker.Root>
          </div>

          <div
            className={[
              'absolute inset-0 flex flex-col transition-opacity duration-150',
              tab === 'custom' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
            ].join(' ')}
            aria-hidden={tab !== 'custom'}
          >
            {customEmojis.length > 0 && (
              <div className="px-2 pt-2">
                <input
                  type="search"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Search custom emojis…"
                  className="w-full appearance-none rounded-lg bg-white/5 px-2.5 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              {customEmojis.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-1.5 text-center px-4">
                  <p className="text-white/30 text-xs">No custom emojis yet</p>
                  <p className="text-white/15 text-[10px]">
                    Add custom emojis to your server for them to show up here
                  </p>
                </div>
              ) : filteredCustom.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-white/30 text-xs">
                    {customQuery
                      ? `No matches for “${customQuery}”`
                      : 'All custom emojis are already in use'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-11 gap-1">
                  {filteredCustom.map((ce) => (
                    <button
                      key={ce.id}
                      type="button"
                      title={ce.name}
                      onClick={() =>
                        select(ce.animated ? `<a:${ce.name}:${ce.id}>` : `<:${ce.name}:${ce.id}>`)
                      }
                      className="flex size-8 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                    >
                      <img src={ce.url} alt={ce.name} className="w-5 h-5 object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          'w-full h-10 min-h-[40px] relative flex items-center justify-center rounded-lg bg-white/5 text-sm transition-colors',
          'hover:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-orange',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open ? 'ring-1 ring-orange bg-white/[0.07]' : '',
        ].join(' ')}
      >
        {value ? (
          isCustomImage && value.startsWith('http') ? (
            <img src={value} alt="" className="w-5 h-5 object-contain" />
          ) : value.startsWith('<:') || value.startsWith('<a:') ? (
            (() => {
              const match = value.match(/^<a?:(\w+):(\d+)>$/);
              const found = match
                ? customEmojis.find((c) => c.id === match[2] || c.name === match[1])
                : null;
              return found ? (
                <img src={found.url} alt={found.name} className="w-5 h-5 object-contain" />
              ) : (
                <span className="text-lg leading-none">{value}</span>
              );
            })()
          ) : isUnicodeEmoji(value) ? (
            <TwemojiImg emoji={value} size={20} />
          ) : (
            <span className="text-lg leading-none">{value}</span>
          )
        ) : (
          <span className="text-white/30 text-xs">{placeholder}</span>
        )}
        <svg
          className={[
            'absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/30 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {panel}
    </div>
  );
}