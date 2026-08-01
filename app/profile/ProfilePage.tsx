'use client';

import Sidebar from '@/components/layout/Sidebar';
import type { FluxerUser, DashboardGuild } from '@/lib/types';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { showToast, showErrorToast } from '@/components/ui/Toast';
import Image from 'next/image';

interface ProfilePageProps {
  user: FluxerUser;
  guilds?: DashboardGuild[];
  currentPage: string;
}

const TZ_GROUPS: { group: string; zones: { value: string; label: string }[] }[] = [
  {
    group: 'Americas',
    zones: [
      { value: 'America/New_York',       label: 'New York (ET)' },
      { value: 'America/Chicago',        label: 'Chicago (CT)' },
      { value: 'America/Denver',         label: 'Denver (MT)' },
      { value: 'America/Phoenix',        label: 'Phoenix (MST)' },
      { value: 'America/Los_Angeles',    label: 'Los Angeles (PT)' },
      { value: 'America/Anchorage',      label: 'Anchorage (AKT)' },
      { value: 'Pacific/Honolulu',       label: 'Honolulu (HST)' },
      { value: 'America/Toronto',        label: 'Toronto (ET)' },
      { value: 'America/Vancouver',      label: 'Vancouver (PT)' },
      { value: 'America/Winnipeg',       label: 'Winnipeg (CT)' },
      { value: 'America/Halifax',        label: 'Halifax (AT)' },
      { value: 'America/St_Johns',       label: 'St. Johns (NT)' },
      { value: 'America/Mexico_City',    label: 'Mexico City (CST)' },
      { value: 'America/Bogota',         label: 'Bogotá (COT)' },
      { value: 'America/Lima',           label: 'Lima (PET)' },
      { value: 'America/Santiago',       label: 'Santiago (CLT)' },
      { value: 'America/Caracas',        label: 'Caracas (VET)' },
      { value: 'America/Sao_Paulo',      label: 'São Paulo (BRT)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
      { value: 'America/Montevideo',     label: 'Montevideo (UYT)' },
    ],
  },
  {
    group: 'Europe',
    zones: [
      { value: 'Europe/London',          label: 'London (GMT/BST)' },
      { value: 'Europe/Dublin',          label: 'Dublin (GMT/IST)' },
      { value: 'Europe/Lisbon',          label: 'Lisbon (WET)' },
      { value: 'Europe/Paris',           label: 'Paris (CET)' },
      { value: 'Europe/Berlin',          label: 'Berlin (CET)' },
      { value: 'Europe/Amsterdam',       label: 'Amsterdam (CET)' },
      { value: 'Europe/Brussels',        label: 'Brussels (CET)' },
      { value: 'Europe/Madrid',          label: 'Madrid (CET)' },
      { value: 'Europe/Rome',            label: 'Rome (CET)' },
      { value: 'Europe/Warsaw',          label: 'Warsaw (CET)' },
      { value: 'Europe/Prague',          label: 'Prague (CET)' },
      { value: 'Europe/Vienna',          label: 'Vienna (CET)' },
      { value: 'Europe/Stockholm',       label: 'Stockholm (CET)' },
      { value: 'Europe/Oslo',            label: 'Oslo (CET)' },
      { value: 'Europe/Copenhagen',      label: 'Copenhagen (CET)' },
      { value: 'Europe/Zurich',          label: 'Zurich (CET)' },
      { value: 'Europe/Budapest',        label: 'Budapest (CET)' },
      { value: 'Europe/Bucharest',       label: 'Bucharest (EET)' },
      { value: 'Europe/Sofia',           label: 'Sofia (EET)' },
      { value: 'Europe/Athens',          label: 'Athens (EET)' },
      { value: 'Europe/Helsinki',        label: 'Helsinki (EET)' },
      { value: 'Europe/Kiev',            label: 'Kyiv (EET)' },
      { value: 'Europe/Riga',            label: 'Riga (EET)' },
      { value: 'Europe/Tallinn',         label: 'Tallinn (EET)' },
      { value: 'Europe/Vilnius',         label: 'Vilnius (EET)' },
      { value: 'Europe/Minsk',           label: 'Minsk (FET)' },
      { value: 'Europe/Moscow',          label: 'Moscow (MSK)' },
      { value: 'Europe/Istanbul',        label: 'Istanbul (TRT)' },
    ],
  },
  {
    group: 'Africa',
    zones: [
      { value: 'Africa/Abidjan',         label: 'Abidjan (GMT)' },
      { value: 'Africa/Lagos',           label: 'Lagos (WAT)' },
      { value: 'Africa/Cairo',           label: 'Cairo (EET)' },
      { value: 'Africa/Nairobi',         label: 'Nairobi (EAT)' },
      { value: 'Africa/Johannesburg',    label: 'Johannesburg (SAST)' },
      { value: 'Africa/Casablanca',      label: 'Casablanca (WET)' },
    ],
  },
  {
    group: 'Asia',
    zones: [
      { value: 'Asia/Dubai',             label: 'Dubai (GST)' },
      { value: 'Asia/Riyadh',            label: 'Riyadh (AST)' },
      { value: 'Asia/Tehran',            label: 'Tehran (IRST)' },
      { value: 'Asia/Karachi',           label: 'Karachi (PKT)' },
      { value: 'Asia/Kolkata',           label: 'Kolkata (IST)' },
      { value: 'Asia/Dhaka',             label: 'Dhaka (BST)' },
      { value: 'Asia/Yangon',            label: 'Yangon (MMT)' },
      { value: 'Asia/Bangkok',           label: 'Bangkok (ICT)' },
      { value: 'Asia/Ho_Chi_Minh',       label: 'Ho Chi Minh (ICT)' },
      { value: 'Asia/Jakarta',           label: 'Jakarta (WIB)' },
      { value: 'Asia/Shanghai',          label: 'Shanghai (CST)' },
      { value: 'Asia/Hong_Kong',         label: 'Hong Kong (HKT)' },
      { value: 'Asia/Singapore',         label: 'Singapore (SGT)' },
      { value: 'Asia/Taipei',            label: 'Taipei (CST)' },
      { value: 'Asia/Seoul',             label: 'Seoul (KST)' },
      { value: 'Asia/Tokyo',             label: 'Tokyo (JST)' },
      { value: 'Asia/Almaty',            label: 'Almaty (ALMT)' },
      { value: 'Asia/Tashkent',          label: 'Tashkent (UZT)' },
      { value: 'Asia/Yekaterinburg',     label: 'Yekaterinburg (YEKT)' },
      { value: 'Asia/Novosibirsk',       label: 'Novosibirsk (NOVT)' },
      { value: 'Asia/Vladivostok',       label: 'Vladivostok (VLAT)' },
    ],
  },
  {
    group: 'Pacific & Oceania',
    zones: [
      { value: 'Australia/Perth',        label: 'Perth (AWST)' },
      { value: 'Australia/Adelaide',     label: 'Adelaide (ACST)' },
      { value: 'Australia/Darwin',       label: 'Darwin (ACST)' },
      { value: 'Australia/Brisbane',     label: 'Brisbane (AEST)' },
      { value: 'Australia/Sydney',       label: 'Sydney (AEST)' },
      { value: 'Australia/Melbourne',    label: 'Melbourne (AEST)' },
      { value: 'Pacific/Auckland',       label: 'Auckland (NZST)' },
      { value: 'Pacific/Fiji',           label: 'Fiji (FJT)' },
      { value: 'Pacific/Guam',           label: 'Guam (ChST)' },
    ],
  },
];

const ALL_ZONES = TZ_GROUPS.flatMap(g => g.zones.map(z => ({ ...z, group: g.group })));

function avatarSrc(user: FluxerUser): string {
  if (user.avatar) return `https://fluxerusercontent.com/avatars/${user.id}/${user.avatar}.png?size=256`;
  return `https://fluxerstatic.com/avatars/${Number(BigInt(user.id) >> BigInt(22)) % 6}.png`;
}

function tzLabel(value: string): string {
  return ALL_ZONES.find(z => z.value === value)?.label ?? value;
}

function TimezonePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return TZ_GROUPS;
    return TZ_GROUPS.map(g => ({
      ...g,
      zones: g.zones.filter(z =>
        z.label.toLowerCase().includes(q) || z.value.toLowerCase().includes(q)
      ),
    })).filter(g => g.zones.length > 0);
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
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2 text-left  transition-colors hover:bg-white/8"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3.5 h-3.5 text-orange/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{tzLabel(value)}</p>
            <p className="text-white/30 text-[10px] font-mono truncate">{value}</p>
          </div>
        </div>
        <svg
          className={['w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform duration-200', open ? 'rotate-180' : ''].join(' ')}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-[#160c0c] shadow-2xl z-30 overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search timezones…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white text-xs placeholder-white/25 focus:outline-none"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="text-white/25 hover:text-white/60 text-sm leading-none">×</button>
              )}
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto pb-2">
            {filtered.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6">No timezones match.</p>
            ) : filtered.map(group => (
              <div key={group.group}>
                <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold px-4 py-1.5 sticky top-0 bg-[#160c0c]">
                  {group.group}
                </p>
                {group.zones.map(zone => (
                  <button
                    key={zone.value}
                    type="button"
                    onClick={() => { onChange(zone.value); setOpen(false); setSearch(''); }}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface Reminder {
  id: string;
  message: string;
  timestamp: number;
  createdAt: number;
  type: 'guild' | 'dm';
  channelId?: string;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pad2(n: number) { return String(n).padStart(2, '0'); }

function parseDt(s: string): { y: number; mo: number; d: number; h: number; mi: number } {
  const [datePart, timePart] = s.split('T');
  const [y, mo, d] = (datePart ?? '').split('-').map(Number);
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number);
  return { y: y || new Date().getFullYear(), mo: (mo || 1) - 1, d: d || 1, h: h || 0, mi: mi || 0 };
}

function formatDt(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad2(mo + 1)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}`;
}

function daysInMonth(y: number, mo: number) {
  return new Date(y, mo + 1, 0).getDate();
}

function ScrollWheel({ items, selected, onSelect }: {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 32;

  useEffect(() => {
    const idx = items.findIndex(i => i.value === selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    }
  }, [selected, items]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
    const dir = e.deltaY > 0 ? 1 : -1;
    const currentIdx = items.findIndex(i => i.value === selected);
    const nextIdx = Math.max(0, Math.min(currentIdx + dir, items.length - 1));
    if (nextIdx !== currentIdx) onSelect(items[nextIdx].value);
  }

  return (
    <div
      ref={ref}
      onWheel={handleWheel}
      className="h-[128px] overflow-y-hidden scrollbar-none relative"
    >
      <div className="pointer-events-none absolute left-0 right-0 top-[48px] h-8 bg-orange/10 rounded-lg z-10" aria-hidden="true" />
      <div className="h-12" />
      {items.map(item => (
        <div
          key={item.value}
          onClick={() => onSelect(item.value)}
          style={{ height: ITEM_H }}
          className={[
            'flex items-center justify-center text-sm cursor-pointer transition-all duration-150 select-none',
            item.value === selected
              ? 'text-orange-warm font-bold'
              : 'text-white/35 hover:text-white/70',
          ].join(' ')}
        >
          {item.label}
        </div>
      ))}
      <div className="h-12" />
    </div>
  );
}

function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const MAX_SECONDS = 63115209;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMo   = now.getMonth();
  const nowDay  = now.getDate();
  const nowHour = now.getHours();
  const nowMin  = now.getMinutes();
  const nowTs   = Math.floor(now.getTime() / 1000);

  const { y, mo, d, h, mi } = parseDt(value);

  const chosenTs = Math.floor(new Date(`${y}-${pad2(mo + 1)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}`).getTime() / 1000);
  const isTooFar = chosenTs - nowTs > MAX_SECONDS;

  const isToday = y === nowYear && mo === nowMo && d === nowDay;
  const isTodayHour = isToday && h === nowHour;

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  const months = MONTHS
    .map((l, i) => ({ value: i, label: l }))
    .filter(item => y > nowYear || item.value >= nowMo);

  const minDay = (y === nowYear && mo === nowMo) ? nowDay : 1;
  const days = Array.from({ length: daysInMonth(y, mo) }, (_, i) => ({ value: i + 1, label: pad2(i + 1) }))
    .filter(item => item.value >= minDay);

  const minHour = isToday ? nowHour : 0;
  const hours = Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad2(i) }))
    .filter(item => item.value >= minHour);

  const minMin = isTodayHour ? nowMin + 1 : 0;
  const mins = Array.from({ length: 60 }, (_, i) => ({ value: i, label: pad2(i) }))
    .filter(item => item.value >= minMin);

  function update(patch: Partial<{ y: number; mo: number; d: number; h: number; mi: number }>) {
    const next = { y, mo, d, h, mi, ...patch };

    const maxD = daysInMonth(next.y, next.mo);
    if (next.d > maxD) next.d = maxD;

    const ts = Math.floor(new Date(`${next.y}-${pad2(next.mo + 1)}-${pad2(next.d)}T${pad2(next.h)}:${pad2(next.mi)}`).getTime() / 1000);
    if (ts <= nowTs) {
      const floor = new Date((nowTs + 60) * 1000);
      next.y  = floor.getFullYear();
      next.mo = floor.getMonth();
      next.d  = floor.getDate();
      next.h  = floor.getHours();
      next.mi = floor.getMinutes();
    }

    const finalTs = Math.floor(new Date(`${next.y}-${pad2(next.mo + 1)}-${pad2(next.d)}T${pad2(next.h)}:${pad2(next.mi)}`).getTime() / 1000);
    if (finalTs - nowTs > MAX_SECONDS) return;

    onChange(formatDt(next.y, next.mo, next.d, next.h, next.mi));
  }

  const displayDate = `${MONTHS[mo]} ${pad2(d)}, ${y}`;
  const displayTime = `${pad2(h)}:${pad2(mi)}`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={[
          'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 hover:bg-white/8 transition-colors',
          isTooFar ? 'bg-red-500/10 focus:ring-red-400' : 'bg-white/5 focus:ring-orange',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className={['w-4 h-4 flex-shrink-0', isTooFar ? 'text-red-400/60' : 'text-orange/50'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className={isTooFar ? 'text-red-300 font-medium' : 'text-white font-medium'}>{displayDate}</span>
          <span className="text-white/30 mx-1">·</span>
          <svg className={['w-3.5 h-3.5 flex-shrink-0', isTooFar ? 'text-red-400/60' : 'text-orange/50'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span className={isTooFar ? 'text-red-300 font-medium' : 'text-white font-medium'}>{displayTime}</span>
        </div>
        <svg
          className={['w-4 h-4 flex-shrink-0 transition-transform duration-200', open ? 'rotate-180' : '', isTooFar ? 'text-red-400/40' : 'text-white/25'].join(' ')}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isTooFar && (
        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Reminders can only be set up to 2 years ahead.
        </p>
      )}

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl bg-[#221616] shadow-2xl overflow-hidden"
          style={{ animation: 'dtPickerIn 0.15s ease-out' }}
        >
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
            <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold">Year</p>
            {[nowYear, nowYear + 1].map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => update({ y: yr })}
                className={[
                  'px-4 py-1 rounded-full text-xs font-semibold transition-colors focus-visible:outline-none',
                  yr === y ? 'bg-orange/20 text-orange-warm' : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/8',
                ].join(' ')}
              >
                {yr}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 border-b border-white/5">
            {['Month','Day','Hour','Min'].map(l => (
              <p key={l} className="text-white/25 text-[10px] uppercase tracking-widest text-center py-2 font-semibold">{l}</p>
            ))}
          </div>

          <div className="grid grid-cols-4 divide-x divide-white/5 px-1 py-1">
            <ScrollWheel items={months} selected={mo} onSelect={v => update({ mo: v })} />
            <ScrollWheel items={days}   selected={d}  onSelect={v => update({ d: v })} />
            <ScrollWheel items={hours}  selected={h}  onSelect={v => update({ h: v })} />
            <ScrollWheel items={mins}   selected={mi} onSelect={v => update({ mi: v })} />
          </div>

          <div className="px-3 pb-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full py-2 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-semibold transition-colors focus-visible:outline-none"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dtPickerIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes pageSlideIn {
          from { opacity: 0; transform: translateX(6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

function ReminderModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Reminder;
  onSave: (message: string, timestamp: number) => Promise<void>;
  onClose: () => void;
}) {
  const [message, setMessage] = useState(initial?.message ?? '');
  const toDatetimeLocal = (ts: number) => {
    const d = new Date(ts * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const defaultDt = initial
    ? toDatetimeLocal(initial.timestamp)
    : toDatetimeLocal(Math.floor(Date.now() / 1000) + 3600);
  const [datetime, setDatetime] = useState(defaultDt);
  const [saving, setSaving] = useState(false);

  const isGuild = initial?.type === 'guild';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !datetime) return;
    setSaving(true);
    const ts = Math.floor(new Date(datetime).getTime() / 1000);
    await onSave(message.trim(), ts);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#471B1B]">
          <div>
            <h2 className="text-white font-bold text-base">{initial ? 'Edit reminder' : 'New reminder'}</h2>
            {!initial && (
              <p className="text-white/30 text-xs mt-0.5">Will be sent to you via DM</p>
            )}
            {isGuild && (
              <p className="text-white/30 text-xs mt-0.5">
                Guild reminder — sent in <span className="font-mono text-orange-light/60">#{initial?.channelId ?? 'channel'}</span>
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="What do you want to be reminded about?"
              className="w-full bg-white/5 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/20  resize-none"
              required
            />
            <p className={['text-xs mt-1 text-right', message.length >= 380 ? 'text-orange-light/70' : 'text-white/20'].join(' ')}>
              {message.length}/400
            </p>
          </div>
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Remind at</label>
            <DateTimePicker value={datetime} onChange={setDatetime} />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/8 text-white/60 hover:text-white/90 text-sm transition-colors focus-visible:outline-none">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-orange hover:bg-orange-bright disabled:opacity-50 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange">
              {saving ? 'Saving…' : (initial ? 'Save changes' : 'Create reminder')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RemindersSection({ userId }: { userId: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | Reminder | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/reminders', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { reminders: [] })
      .then(data => setReminders(data.reminders ?? []))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleCreate(message: string, timestamp: number) {
    const res = await fetch('/api/users/reminders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, timestamp }),
    });
    if (res.ok) {
      const { reminder } = await res.json();
      setReminders(prev => [...prev, reminder]);
    }
  }

  async function handleEdit(reminder: Reminder, message: string, timestamp: number) {
    const res = await fetch(`/api/users/reminders/${reminder.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, timestamp }),
    });
    if (res.ok) {
      setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, message, timestamp } : r));
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/users/reminders/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setReminders(prev => {
        const updated = prev.filter(r => r.id !== id);
        const newTotal = Math.ceil(updated.length / PAGE_SIZE);
        if (page >= newTotal && page > 0) setPage(p => p - 1);
        return updated;
      });
    }
    setDeleting(null);
  }

  const PAGE_SIZE = 4;
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const sorted = [...reminders].sort((a, b) => a.timestamp - b.timestamp);
  const now = Math.floor(Date.now() / 1000);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function goToPage(newPage: number) {
    if (newPage === page) return;
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
  }

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  };

  return (
    <>
      <section className="rounded-2xl bg-bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">Reminders</h2>
            <p className="text-white/20 text-[10px] mt-0.5">New reminders are sent via DM</p>
          </div>
          <button
            type="button"
            onClick={() => setModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Create
          </button>
        </div>

        {loading ? (
          <p className="text-white/30 text-sm">Loading…</p>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-8 h-8 text-white/15 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <p className="text-white/30 text-sm">No reminders yet.</p>
            <button type="button" onClick={() => setModal('create')} className="mt-3 text-orange-warm/70 hover:text-orange-warm text-xs transition-colors focus-visible:outline-none">
              Create one →
            </button>
          </div>
        ) : (
          <>
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.ul
                  key={page}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="space-y-2"
                >
                  {paginated.map(r => {
                    const isPast = r.timestamp < now;
                    const isGuild = r.type === 'guild';
                    return (
                      <li key={r.id} className={['rounded-xl px-4 py-3 flex items-start gap-3 group', isPast ? 'bg-white/[0.02] opacity-55' : 'bg-white/[0.03]'].join(' ')}>
                        {isGuild ? (
                          <svg className={['w-4 h-4 mt-2 flex-shrink-0', isPast ? 'text-white/20' : 'text-white/40'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg className={['w-4 h-4 mt-3 flex-shrink-0', isPast ? 'text-white/20' : 'text-orange/50'].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isGuild && (
                              <span className="text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded bg-white/8 text-white/30">
                                Guild
                              </span>
                            )}
                          </div>
                          <p className="text-white/80 text-sm leading-snug break-words">{r.message.length > 35 ? `${r.message.slice(0, 30)}...` : r.message}</p>
                          <p className={['text-xs mt-1', isPast ? 'text-white/25' : 'text-orange-light/50'].join(' ')}>
                            {isPast ? '✓ ' : ''}{formatTimestamp(r.timestamp)}
                          </p>
                        </div>
                        {!isPast && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setModal(r)}
                            className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors focus-visible:outline-none"
                            aria-label="Edit reminder"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            disabled={deleting === r.id}
                            className="p-1.5 rounded-md text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:outline-none disabled:opacity-50"
                            aria-label="Delete reminder"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          </div>
                        )}
                      </li>
                    )
                  })}

                  {Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                    <li
                      key={`skeleton-${page}-${i}`}
                      className="rounded-xl px-3 py-[17.5px] flex items-start gap-2 group bg-white/[0.015] pointer-events-none"
                      aria-hidden="true"
                    >
                      <div className="w-4 h-4 mt-1.5 rounded-full bg-[#312422] flex-shrink-0" />
                  
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-3 rounded bg-[#312422] w-[72%]" />
                        <div className="h-3 rounded bg-[#312422] w-[44%]" />
                      </div>
                  
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0">
                        <div className="w-20 h-7" />
                        <div className="w-7 h-7" />
                      </div>
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>


            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <p className="text-white/25 text-xs">
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goToPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-none"
                    aria-label="Previous page"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToPage(i)}
                      className={[
                        'w-6 h-6 rounded-md text-xs font-medium transition-colors focus-visible:outline-none',
                        i === page ? 'bg-orange/20 text-orange-warm' : 'text-white/30 hover:text-white/60 hover:bg-white/5',
                      ].join(' ')}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => goToPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="p-1.5 rounded-md text-white/30 hover:text-white/70 disabled:opacity-20 transition-colors focus-visible:outline-none"
                    aria-label="Next page"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        </section>

      {modal === 'create' && (
        <ReminderModal onSave={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal && modal !== 'create' && (
        <ReminderModal
          initial={modal}
          onSave={(msg, ts) => handleEdit(modal, msg, ts)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

export default function ProfilePage({ user: initialUser, guilds }: ProfilePageProps) {
  const [user, setUser] = useState<FluxerUser>(initialUser);
  const [timezone, setTimezone] = useState(initialUser.timezone ?? 'America/New_York');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setUser(data.user);
          setTimezone(data.user.timezone ?? 'America/New_York');
        }
      });
  }, []);


  const displayName = user.global_name ?? user.username;

  return (
    <div className="min-h-screen bg-bg-dark flex">
      <Sidebar user={user as FluxerUser} guilds={guilds} currentPage="profile" />

      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">

        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Profile Settings</h1>
          <p className="text-white/35 text-sm mt-1">Manage your personal preferences for the Functious dashboard.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <section className="w-full md:w-48 shrink-0 rounded-2xl bg-bg-card p-5 flex flex-col items-center text-center gap-3">
            <p className="text-white/45 text-xs font-semibold uppercase tracking-widest self-start">Account Info</p>
            <div className="relative mt-1">
              <Image
                src={avatarSrc(user)}
                alt={displayName}
                width={72}
                height={72}
                className="rounded-2xl ring-2 ring-orange/25"
              />
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-orange border-2 border-bg-card" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-white font-semibold text-sm truncate">{displayName}</p>
              {user.global_name && <p className="text-white/40 text-xs mt-0.5 truncate">@{user.username}</p>}              
              <p
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                title="Click to copy"
                className="text-white/20 text-[10px] font-mono mt-1.5 break-all leading-relaxed cursor-pointer hover:text-white/40 transition-colors select-all"
              >
                {copied ? 'Copied!' : user.id}
              </p>
            </div>
          </section>

          <div className="flex-1 space-y-4 w-full">
            <section className="rounded-2xl bg-bg-card p-6">
              <div className="mb-4">
                <h2 className="text-white/45 text-xs font-semibold uppercase tracking-widest">Timezone</h2>
                <p className="text-white/20 text-[10px] mt-0.5">Used for reminder times and timezone conversions in your servers.</p>
              </div>
              <div>
                <TimezonePicker value={timezone} onChange={async (v) => {
                  setTimezone(v);
                  try {
                    await fetch('/api/users/profile', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ timezone: v }),
                    });

                    showToast('Saved');
                  } catch (err) {
                    console.error(err);
                    showErrorToast('Failed to save.');
                  }
                }} />
              </div>
            </section>
            <RemindersSection userId={user.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
