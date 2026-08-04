'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface Role {
  id: string;
  name: string;
  color?: number;
}

function roleColor(color?: number): string {
  if (!color) return 'rgba(255,255,255,0.4)';
  return `#${color.toString(16).padStart(6, '0')}`;
}

interface RolesDropdownProps {
  roles: Role[];
  placeholder?: string;
  multiple?: false;
  value?: string;
  onChange?: (id: string) => void;
  multiValue?: string[];
  onMultiChange?: (ids: string[]) => void;
}

interface RolesDropdownMultiProps {
  roles: Role[];
  placeholder?: string;
  multiple: true;
  multiValue: string[];
  onMultiChange: (ids: string[]) => void;
  value?: never;
  onChange?: never;
}

type Props = RolesDropdownProps | RolesDropdownMultiProps;

export default function RolesDropdown(props: Props) {
  const { roles, placeholder = 'Select a role…', multiple = false } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function updateDropdownStyle() {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateDropdownStyle();
    window.addEventListener('scroll', updateDropdownStyle, true);
    window.addEventListener('resize', updateDropdownStyle);
    return () => {
      window.removeEventListener('scroll', updateDropdownStyle, true);
      window.removeEventListener('resize', updateDropdownStyle);
    };
  }, [open]);

  const singleValue: string = multiple ? '' : (props.value ?? '');
  const multiValue: string[] = multiple ? (props as RolesDropdownMultiProps).multiValue : [];

  const filtered = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.includes(search),
  );

  function isSelected(id: string): boolean {
    return multiple ? multiValue.includes(id) : singleValue === id;
  }

  function handleSelect(id: string) {
    if (!multiple) {
      (props as RolesDropdownProps).onChange?.(id);
      setOpen(false);
      setSearch('');
    } else {
      const p = props as RolesDropdownMultiProps;
      const next = p.multiValue.includes(id)
        ? p.multiValue.filter((v) => v !== id)
        : [...p.multiValue, id];
      p.onMultiChange(next);
    }
  }

  function handleClear() {
    if (!multiple) {
      (props as RolesDropdownProps).onChange?.('');
      setOpen(false);
      setSearch('');
    } else {
      (props as RolesDropdownMultiProps).onMultiChange([]);
    }
  }

  function triggerLabel(): React.ReactNode {
    if (!multiple) {
      const selected = roles.find((r) => r.id === singleValue);
      if (!selected) return <span className="text-white/30 text-sm">{placeholder}</span>;
      return (
        <span className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: roleColor(selected.color) }}
          />
          <span className="text-white text-sm truncate">{selected.name}</span>
        </span>
      );
    }

    if (multiValue.length === 0)
      return <span className="text-white/30 text-sm">{placeholder}</span>;

    if (multiValue.length === 1) {
      const r = roles.find((x) => x.id === multiValue[0]);
      return (
        <span className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: r ? roleColor(r.color) : 'rgba(255,255,255,0.4)' }}
          />
          <span className="text-white text-sm truncate">{r?.name ?? multiValue[0]}</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 flex-wrap">
        {multiValue.slice(0, 3).map((id) => {
          const r = roles.find((x) => x.id === id);
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: r ? `${roleColor(r.color)}22` : 'rgba(255,255,255,0.06)',
                color: r ? roleColor(r.color) : 'rgba(255,255,255,0.6)',
              }}
            >
              {r?.name ?? id}
            </span>
          );
        })}
        {multiValue.length > 3 && (
          <span className="text-xs text-white/40">+{multiValue.length - 3} more</span>
        )}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left hover:bg-white/8 transition-colors min-h-[42px]"
      >
        <span className="flex-1 min-w-0">{triggerLabel()}</span>
        <svg
          className={[
            'w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform',
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

      {open && (
        <div
          style={dropdownStyle}
          className="rounded-xl bg-[#221616] shadow-2xl overflow-hidden"
        >
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              autoFocus
            />
          </div>

          {multiple && multiValue.length > 0 && (
            <div className="flex items-center justify-between px-4 pb-1.5">
              <span className="text-[10px] text-white/30">{multiValue.length} selected</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-white/40 hover:text-white/70 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto pb-2">
            {!multiple && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-4 py-2 text-xs text-left text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
              >
                None
              </button>
            )}

            {filtered.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">No roles found.</p>
            ) : (
              filtered.map((role) => {
                const selected = isSelected(role.id);
                const color = roleColor(role.color);

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelect(role.id)}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-2 text-xs text-left transition-colors',
                      selected
                        ? 'bg-orange/10 text-orange-warm'
                        : 'text-white/65 hover:bg-white/5 hover:text-white',
                    ].join(' ')}
                  >
                    {multiple && (
                      <span
                        className={[
                          'flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors',
                          selected ? 'bg-orange border-orange' : 'border-white/20 bg-white/5',
                        ].join(' ')}
                        aria-hidden="true"
                      >
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    )}

                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />

                    <span className="truncate font-medium">{role.name}</span>
                  </button>
                );
              })
            )}
          </div>

          {multiple && (
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch('');
                }}
                className="w-full py-2 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}