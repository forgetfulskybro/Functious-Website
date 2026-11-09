'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface Option {
  id: string;
  label: string;
  hint?: string;
}

function sameSelection(a: string[], b: string[]) {
  return a.length === b.length && a.every((value) => b.includes(value));
}

export default function MultiSelect({
  options,
  values,
  onChange,
  placeholder,
  searchPlaceholder = 'Search…',
  disabled,
}: {
  options: Option[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState(values);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setDraft(values);
  }, [open, values]);

  useEffect(() => {
    if (!open) return;

    function commitAndClose() {
      setOpen(false);
      if (!sameSelection(draft, values)) onChange(draft);
    }

    function onOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) commitAndClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') commitAndClose();
    }

    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, draft, values, onChange]);

  const activeValues = open ? draft : values;
  const selected = useMemo(() => new Set(activeValues), [activeValues]);
  const selectedLabels = useMemo(
    () =>
      options
        .filter((option) => selected.has(option.id))
        .map((option) => option.label),
    [options, selected]
  );
  const selectionLabel = selectedLabels.length
    ? `${selectedLabels.slice(0, 2).join(', ')}${
        selectedLabels.length > 2
          ? ` +${selectedLabels.length - 2} more`
          : ''
      }`
    : activeValues.length
      ? `${activeValues.length} selected`
      : placeholder;
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.id.includes(query) ||
        option.hint?.toLowerCase().includes(query)
    );
  }, [options, search]);

  function toggle(id: string) {
    setDraft(
      selected.has(id)
        ? draft.filter((value) => value !== id)
        : [...draft, id]
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            setOpen(false);
            if (!sameSelection(draft, values)) onChange(draft);
          } else {
            setDraft(values);
            setOpen(true);
          }
        }}
        aria-expanded={open}
        className="flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={
            activeValues.length
              ? 'truncate text-sm text-white'
              : 'truncate text-sm text-white/30'
          }
        >
          {selectionLabel}
        </span>
        <svg
          className={[
            'h-3.5 w-3.5 flex-shrink-0 text-white/30 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl bg-[#221616] shadow-2xl">
          <div className="px-3 pb-2 pt-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg bg-white/5 px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
            />
          </div>

          <div className="max-h-56 overflow-y-auto pb-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs text-white/30">
                No matches.
              </p>
            ) : (
              filtered.map((option) => {
                const checked = selected.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(option.id)}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs text-white/65 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <span
                      className={[
                        'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border',
                        checked
                          ? 'border-orange bg-orange text-white'
                          : 'border-white/15 bg-white/[0.03]',
                      ].join(' ')}
                    >
                      {checked && (
                        <svg
                          className="h-2.5 w-2.5"
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
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                    {option.hint && (
                      <span className="flex-shrink-0 text-[10px] text-white/20">
                        {option.hint}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {activeValues.length > 0 && (
            <div className="border-t border-white/5 p-2">
              <button
                type="button"
                onClick={() => setDraft([])}
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
