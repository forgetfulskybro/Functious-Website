"use client";

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";

interface Channel {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
}

interface ChannelGroup {
  categoryId: string | null;
  categoryName: string;
  channels: Channel[];
}

function buildGroups(channels: Channel[], types: number[]): ChannelGroup[] {
  const onlyCategories =
    types.length > 0 && types.every((t) => t === 4);

  if (onlyCategories) {
    const cats = channels.filter((c) => c.type === 4);
    if (cats.length === 0) return [];
    return [
      {
        categoryId: null,
        categoryName: "Categories",
        channels: cats,
      },
    ];
  }

  const categories = channels.filter((c) => c.type === 4);
  const others = channels.filter(
    (c) => c.type !== 4 && (types.length === 0 || types.includes(c.type ?? -1)),
  );

  const grouped = new Map<string | null, Channel[]>();
  for (const ch of others) {
    const key = ch.parentId ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(ch);
  }

  const result: ChannelGroup[] = [];

  const uncategorized = grouped.get(null) ?? [];
  if (uncategorized.length > 0) {
    result.push({
      categoryId: null,
      categoryName: "Uncategorized",
      channels: uncategorized,
    });
  }

  for (const cat of categories) {
    const members = grouped.get(cat.id) ?? [];
    if (members.length > 0) {
      result.push({
        categoryId: cat.id,
        categoryName: cat.name,
        channels: members,
      });
    }
  }

  return result;
}

export default function ChannelDropdown({
  channels,
  value,
  onChangeAction,
  placeholder = "Select a channel…",
  types = [0],
}: {
  channels: Channel[];
  value: string;
  onChangeAction: (id: string) => void;
  placeholder?: string;
  types?: number[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateDropdownStyle() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }

  function toggleOpen() {
    if (!open) {
      updateDropdownStyle();
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateDropdownStyle();
    setTimeout(() => inputRef.current?.focus(), 50);
    window.addEventListener("scroll", updateDropdownStyle, true);
    window.addEventListener("resize", updateDropdownStyle);
    return () => {
      window.removeEventListener("scroll", updateDropdownStyle, true);
      window.removeEventListener("resize", updateDropdownStyle);
    };
  }, [open]);

  const groups = useMemo(() => buildGroups(channels, types), [channels, types]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        channels: g.channels.filter(
          (c) => c.name.toLowerCase().includes(q) || c.id.includes(q),
        ),
      }))
      .filter((g) => g.channels.length > 0);
  }, [groups, search]);

  const selected = channels.find((c) => c.id === value);

  function channelIcon(type?: number) {
    if (type === 4) {
      return (
        <svg
          className="w-3 h-3 text-white/35 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    if (type === 2) {
      return (
        <svg
          className="w-3 h-3 text-white/35 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path
            d="M19 10v2a7 7 0 0 1-14 0v-2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
          <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <span className="text-white/35 text-xs leading-none flex-shrink-0">
        #
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left hover:bg-white/8 transition-colors"
      >
        <span
          className={
            selected ? "text-white text-sm truncate" : "text-white/30 text-sm"
          }
        >
          {selected ? (
            <span className="flex items-center gap-1.5">
              {channelIcon(selected.type)}
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            placeholder
          )}
        </span>
        <svg
          className={[
            "w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={dropdownStyle}
          className="rounded-xl bg-[#221616] shadow-2xl overflow-hidden"
        >
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <svg
                className="w-3.5 h-3.5 text-white/25 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search channels…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs placeholder-white/25 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-white/25 hover:text-white/60 text-sm leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto pb-2">
            <button
              type="button"
              onClick={() => {
                onChangeAction("");
                setOpen(false);
                setSearch("");
              }}
              className="w-full px-4 py-2 text-xs text-left text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
            >
              None
            </button>

            {filteredGroups.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">
                No channels found.
              </p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.categoryId ?? "__uncategorized__"}>
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold px-4 py-1.5 sticky top-0 bg-[#221616] flex items-center gap-1.5">
                    <svg
                      className="w-2.5 h-2.5 text-white/20 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {group.categoryName}
                  </p>

                  {group.channels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => {
                        onChangeAction(channel.id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={[
                        "w-full flex items-center gap-2 px-4 py-2 text-xs text-left transition-colors",
                        channel.id === value
                          ? "bg-orange/10 text-orange-warm"
                          : "text-white/65 hover:bg-white/5 hover:text-white",
                      ].join(" ")}
                    >
                      {channelIcon(channel.type)}
                      <span className="truncate font-medium">
                        {channel.name}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}