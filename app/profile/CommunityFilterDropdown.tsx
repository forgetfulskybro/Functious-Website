'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CommunityOption {
  value: string;
  label: string;
}

interface CommunityFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: CommunityOption[];
  placeholder?: string;
}

export default function CommunityFilterDropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: CommunityFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);
  const needle = search.trim().toLowerCase();
  const filtered = options.filter(
    (option) =>
      !needle ||
      option.label.toLowerCase().includes(needle) ||
      option.value.toLowerCase().includes(needle),
  );

  function measure() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }

  function close() {
    setOpen(false);
    setSearch('');
  }

  useEffect(() => {
    function onOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    measure();
    function update() {
      measure();
    }

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  function select(next: string) {
    onChange(next);
    close();
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="overflow-hidden rounded-xl border border-white/5 bg-[#221616] shadow-2xl"
        >
          {options.length > 6 && (
            <div className="px-3 pb-2 pt-3">
              <div className="flex h-9 items-center gap-2 rounded-lg bg-white/5 px-3">
                <span className="pointer-events-none flex h-3.5 w-3.5 shrink-0 items-center justify-center text-white/25">
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search communities…"
                  aria-label="Search communities"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="h-full min-w-0 flex-1 bg-transparent p-0 text-xs text-white placeholder-white/25 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div role="listbox" aria-label="Communities" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs text-white/30">
                No communities found.
              </p>
            ) : (
              filtered.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => select(option.value)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors ${
                      active
                        ? 'bg-orange/10 text-orange-warm'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && (
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        aria-hidden="true"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) measure();
          setOpen((current) => !current);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2 text-left text-xs text-white/70 transition-colors hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-orange/40"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-white/30 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {menu}
    </div>
  );
}
