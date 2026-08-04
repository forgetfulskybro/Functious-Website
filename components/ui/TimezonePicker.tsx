'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

const TZ_GROUPS: { group: string; zones: { value: string; label: string }[] }[] = [
  {
    group: 'Americas',
    zones: [
      { value: 'America/New_York',                  label: 'New York (ET)' },
      { value: 'America/Chicago',                   label: 'Chicago (CT)' },
      { value: 'America/Denver',                    label: 'Denver (MT)' },
      { value: 'America/Phoenix',                   label: 'Phoenix (MST)' },
      { value: 'America/Los_Angeles',               label: 'Los Angeles (PT)' },
      { value: 'America/Anchorage',                 label: 'Anchorage (AKT)' },
      { value: 'Pacific/Honolulu',                  label: 'Honolulu (HST)' },
      { value: 'America/Toronto',                   label: 'Toronto (ET)' },
      { value: 'America/Vancouver',                 label: 'Vancouver (PT)' },
      { value: 'America/Winnipeg',                  label: 'Winnipeg (CT)' },
      { value: 'America/Halifax',                   label: 'Halifax (AT)' },
      { value: 'America/St_Johns',                  label: 'St. Johns (NT)' },
      { value: 'America/Mexico_City',               label: 'Mexico City (CST)' },
      { value: 'America/Bogota',                    label: 'Bogotá (COT)' },
      { value: 'America/Lima',                      label: 'Lima (PET)' },
      { value: 'America/Santiago',                  label: 'Santiago (CLT)' },
      { value: 'America/Caracas',                   label: 'Caracas (VET)' },
      { value: 'America/Sao_Paulo',                 label: 'São Paulo (BRT)' },
      { value: 'America/Argentina/Buenos_Aires',    label: 'Buenos Aires (ART)' },
      { value: 'America/Montevideo',                label: 'Montevideo (UYT)' },
    ],
  },
  {
    group: 'Europe',
    zones: [
      { value: 'Europe/London',     label: 'London (GMT/BST)' },
      { value: 'Europe/Dublin',     label: 'Dublin (GMT/IST)' },
      { value: 'Europe/Lisbon',     label: 'Lisbon (WET)' },
      { value: 'Europe/Paris',      label: 'Paris (CET)' },
      { value: 'Europe/Berlin',     label: 'Berlin (CET)' },
      { value: 'Europe/Amsterdam',  label: 'Amsterdam (CET)' },
      { value: 'Europe/Brussels',   label: 'Brussels (CET)' },
      { value: 'Europe/Madrid',     label: 'Madrid (CET)' },
      { value: 'Europe/Rome',       label: 'Rome (CET)' },
      { value: 'Europe/Warsaw',     label: 'Warsaw (CET)' },
      { value: 'Europe/Prague',     label: 'Prague (CET)' },
      { value: 'Europe/Vienna',     label: 'Vienna (CET)' },
      { value: 'Europe/Stockholm',  label: 'Stockholm (CET)' },
      { value: 'Europe/Oslo',       label: 'Oslo (CET)' },
      { value: 'Europe/Copenhagen', label: 'Copenhagen (CET)' },
      { value: 'Europe/Zurich',     label: 'Zurich (CET)' },
      { value: 'Europe/Budapest',   label: 'Budapest (CET)' },
      { value: 'Europe/Bucharest',  label: 'Bucharest (EET)' },
      { value: 'Europe/Sofia',      label: 'Sofia (EET)' },
      { value: 'Europe/Athens',     label: 'Athens (EET)' },
      { value: 'Europe/Helsinki',   label: 'Helsinki (EET)' },
      { value: 'Europe/Kiev',       label: 'Kyiv (EET)' },
      { value: 'Europe/Riga',       label: 'Riga (EET)' },
      { value: 'Europe/Tallinn',    label: 'Tallinn (EET)' },
      { value: 'Europe/Vilnius',    label: 'Vilnius (EET)' },
      { value: 'Europe/Minsk',      label: 'Minsk (FET)' },
      { value: 'Europe/Moscow',     label: 'Moscow (MSK)' },
      { value: 'Europe/Istanbul',   label: 'Istanbul (TRT)' },
    ],
  },
  {
    group: 'Africa',
    zones: [
      { value: 'Africa/Abidjan',      label: 'Abidjan (GMT)' },
      { value: 'Africa/Lagos',        label: 'Lagos (WAT)' },
      { value: 'Africa/Cairo',        label: 'Cairo (EET)' },
      { value: 'Africa/Nairobi',      label: 'Nairobi (EAT)' },
      { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
      { value: 'Africa/Casablanca',   label: 'Casablanca (WET)' },
    ],
  },
  {
    group: 'Asia',
    zones: [
      { value: 'Asia/Dubai',         label: 'Dubai (GST)' },
      { value: 'Asia/Riyadh',        label: 'Riyadh (AST)' },
      { value: 'Asia/Tehran',        label: 'Tehran (IRST)' },
      { value: 'Asia/Karachi',       label: 'Karachi (PKT)' },
      { value: 'Asia/Kolkata',       label: 'Kolkata (IST)' },
      { value: 'Asia/Dhaka',         label: 'Dhaka (BST)' },
      { value: 'Asia/Yangon',        label: 'Yangon (MMT)' },
      { value: 'Asia/Bangkok',       label: 'Bangkok (ICT)' },
      { value: 'Asia/Ho_Chi_Minh',   label: 'Ho Chi Minh (ICT)' },
      { value: 'Asia/Jakarta',       label: 'Jakarta (WIB)' },
      { value: 'Asia/Shanghai',      label: 'Shanghai (CST)' },
      { value: 'Asia/Hong_Kong',     label: 'Hong Kong (HKT)' },
      { value: 'Asia/Singapore',     label: 'Singapore (SGT)' },
      { value: 'Asia/Taipei',        label: 'Taipei (CST)' },
      { value: 'Asia/Seoul',         label: 'Seoul (KST)' },
      { value: 'Asia/Tokyo',         label: 'Tokyo (JST)' },
      { value: 'Asia/Almaty',        label: 'Almaty (ALMT)' },
      { value: 'Asia/Tashkent',      label: 'Tashkent (UZT)' },
      { value: 'Asia/Yekaterinburg', label: 'Yekaterinburg (YEKT)' },
      { value: 'Asia/Novosibirsk',   label: 'Novosibirsk (NOVT)' },
      { value: 'Asia/Vladivostok',   label: 'Vladivostok (VLAT)' },
    ],
  },
  {
    group: 'Pacific & Oceania',
    zones: [
      { value: 'Australia/Perth',     label: 'Perth (AWST)' },
      { value: 'Australia/Adelaide',  label: 'Adelaide (ACST)' },
      { value: 'Australia/Darwin',    label: 'Darwin (ACST)' },
      { value: 'Australia/Brisbane',  label: 'Brisbane (AEST)' },
      { value: 'Australia/Sydney',    label: 'Sydney (AEST)' },
      { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
      { value: 'Pacific/Auckland',    label: 'Auckland (NZST)' },
      { value: 'Pacific/Fiji',        label: 'Fiji (FJT)' },
      { value: 'Pacific/Guam',        label: 'Guam (ChST)' },
    ],
  },
];

const ALL_ZONES = TZ_GROUPS.flatMap((g) => g.zones.map((z) => ({ ...z, group: g.group })));

export function tzLabel(value: string): string {
  return ALL_ZONES.find((z) => z.value === value)?.label ?? value;
}

export default function TimezonePicker({
  value,
  onChangeAction,
}: {
  value: string;
  onChangeAction: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return TZ_GROUPS;
    return TZ_GROUPS.map((g) => ({
      ...g,
      zones: g.zones.filter(
        (z) => z.label.toLowerCase().includes(q) || z.value.toLowerCase().includes(q)
      ),
    })).filter((g) => g.zones.length > 0);
  }, [search]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/8"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="w-3.5 h-3.5 text-orange/60 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{tzLabel(value)}</p>
            <p className="text-white/30 text-[10px] font-mono truncate">{value}</p>
          </div>
        </div>
        <svg
          className={[
            'w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform duration-200',
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
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-[#160c0c] shadow-2xl z-30 overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <svg
                className="w-3.5 h-3.5 text-white/30 flex-shrink-0"
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
                placeholder="Search timezones…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs placeholder-white/25 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-white/25 hover:text-white/60 text-sm leading-none"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto pb-2">
            {filtered.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6">No timezones match.</p>
            ) : (
              filtered.map((group) => (
                <div key={group.group}>
                  <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold px-4 py-1.5 sticky top-0 bg-[#160c0c]">
                    {group.group}
                  </p>
                  {group.zones.map((zone) => (
                    <button
                      key={zone.value}
                      type="button"
                      onClick={() => {
                        onChangeAction(zone.value);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={[
                        'w-full flex items-center justify-between gap-3 px-4 py-2 text-xs transition-colors text-left',
                        zone.value === value
                          ? 'bg-orange/10 text-orange-warm'
                          : 'text-white/65 hover:bg-white/5 hover:text-white',
                      ].join(' ')}
                    >
                      <span className="font-medium">{zone.label}</span>
                      <span className="text-white/25 font-mono text-[10px] truncate">{zone.value}</span>
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
