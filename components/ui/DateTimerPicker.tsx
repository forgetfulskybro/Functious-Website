'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MIN_AHEAD_MS = 5 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function parseDt(s: string): { y: number; mo: number; d: number; h: number; mi: number } {
  const [datePart, timePart] = s.split('T');
  const [y, mo, d] = (datePart ?? '').split('-').map(Number);
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number);
  return {
    y: y || new Date().getFullYear(),
    mo: (mo || 1) - 1,
    d: d || 1,
    h: h || 0,
    mi: mi || 0,
  };
}

export function formatDt(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad2(mo + 1)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}`;
}

function daysInMonth(y: number, mo: number) {
  return new Date(y, mo + 1, 0).getDate();
}

function minAllowedDate(from: Date = new Date()) {
  return new Date(from.getTime() + MIN_AHEAD_MS);
}

function toParts(date: Date) {
  return {
    y: date.getFullYear(),
    mo: date.getMonth(),
    d: date.getDate(),
    h: date.getHours(),
    mi: date.getMinutes(),
  };
}

function partsToDate(p: { y: number; mo: number; d: number; h: number; mi: number }) {
  return new Date(p.y, p.mo, p.d, p.h, p.mi, 0, 0);
}

function ScrollWheel({
  items,
  selected,
  onSelect,
}: {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ITEM_H = 32;

  useEffect(() => {
    const idx = items.findIndex((i) => i.value === selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    }
  }, [selected, items]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    const currentIdx = items.findIndex((i) => i.value === selected);
    const nextIdx = Math.max(0, Math.min(currentIdx + dir, items.length - 1));
    if (nextIdx !== currentIdx) onSelect(items[nextIdx].value);
  }

  return (
    <div
      ref={ref}
      onWheel={handleWheel}
      className="h-[128px] overflow-y-hidden scrollbar-none relative"
    >
      <div
        className="pointer-events-none absolute left-0 right-0 top-[48px] h-8 bg-orange/10 rounded-lg z-10"
        aria-hidden="true"
      />
      <div className="h-12" />
      {items.map((item) => (
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

export function DateTimePicker({
  value,
  onChangeAction,
}: {
  value: string;
  onChangeAction: (v: string) => void;
}) {
  const MAX_SECONDS = 63115209;
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) setNowTick(Date.now());
  }, [open]);

  const now = new Date(nowTick);
  const minDate = minAllowedDate(now);
  const minParts = toParts(minDate);
  const nowTs = Math.floor(now.getTime() / 1000);
  const minTs = Math.floor(minDate.getTime() / 1000);

  const { y, mo, d, h, mi } = parseDt(value);

  const chosenTs = Math.floor(partsToDate({ y, mo, d, h, mi }).getTime() / 1000);
  const isTooFar = chosenTs - nowTs > MAX_SECONDS;
  const isTooSoon = chosenTs < minTs;
  const isMinDay = y === minParts.y && mo === minParts.mo && d === minParts.d;
  const isMinHour = isMinDay && h === minParts.h;

  useEffect(() => {
    if (!open) return;
    function onOut(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const update = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (chosenTs >= minTs) return;
    const p = toParts(minDate);
    onChangeAction(formatDt(p.y, p.mo, p.d, p.h, p.mi));
  }, [nowTick]);

  const months = MONTHS.map((l, i) => ({ value: i, label: l })).filter(
    (item) => y > minParts.y || item.value >= minParts.mo
  );

  const minDay = y === minParts.y && mo === minParts.mo ? minParts.d : 1;
  const days = Array.from({ length: daysInMonth(y, mo) }, (_, i) => ({
    value: i + 1,
    label: pad2(i + 1),
  })).filter((item) => item.value >= minDay);

  const minHour = isMinDay ? minParts.h : 0;
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: pad2(i),
  })).filter((item) => item.value >= minHour);

  const minMin = isMinHour ? minParts.mi : 0;
  const mins = Array.from({ length: 60 }, (_, i) => ({
    value: i,
    label: pad2(i),
  })).filter((item) => item.value >= minMin);

  function update(
    patch: Partial<{ y: number; mo: number; d: number; h: number; mi: number }>
  ) {
    const next = { y, mo, d, h, mi, ...patch };
    const maxD = daysInMonth(next.y, next.mo);
    if (next.d > maxD) next.d = maxD;

    let nextDate = partsToDate(next);

    if (nextDate.getTime() < minDate.getTime()) {
      const floor = toParts(minDate);
      next.y = floor.y;
      next.mo = floor.mo;
      next.d = floor.d;
      next.h = floor.h;
      next.mi = floor.mi;
      nextDate = partsToDate(next);
    }

    const finalTs = Math.floor(nextDate.getTime() / 1000);
    if (finalTs - nowTs > MAX_SECONDS) return;

    onChangeAction(formatDt(next.y, next.mo, next.d, next.h, next.mi));
  }

  const displayDate = `${MONTHS[mo]} ${pad2(d)}, ${y}`;
  const displayTime = `${pad2(h)}:${pad2(mi)}`;

  const panel =
    open && mounted
      ? createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: Math.max(coords.width, 280),
              zIndex: 9999,
            }}
            className="rounded-xl bg-[#221616] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
              <p className="text-white/25 text-[10px] uppercase tracking-widest font-semibold">
                Year
              </p>
              {[minParts.y, minParts.y + 1].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => update({ y: yr })}
                  className={
                    yr === y
                      ? 'px-4 py-1 rounded-full text-xs font-semibold bg-orange/20 text-orange-warm'
                      : 'px-4 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/40 hover:bg-white/8'
                  }
                >
                  {yr}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 border-b border-white/5">
              {['Month', 'Day', 'Hour', 'Min'].map((l) => (
                <p
                  key={l}
                  className="text-white/25 text-[10px] uppercase tracking-widest text-center py-2 font-semibold"
                >
                  {l}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-4 divide-x divide-white/5 px-1 py-1">
              <ScrollWheel items={months} selected={mo} onSelect={(v) => update({ mo: v })} />
              <ScrollWheel items={days} selected={d} onSelect={(v) => update({ d: v })} />
              <ScrollWheel items={hours} selected={h} onSelect={(v) => update({ h: v })} />
              <ScrollWheel items={mins} selected={mi} onSelect={(v) => update({ mi: v })} />
            </div>
            <div className="px-3 pb-3 pt-1 space-y-2">
              <p className="text-white/20 text-[10px] text-center">
                Earliest: {minDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                {' '}(+5 min)
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-2 rounded-lg bg-orange/10 hover:bg-orange/20 text-orange-warm text-xs font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm focus:outline-none hover:bg-white/8 transition-colors',
          isTooFar || isTooSoon ? 'bg-red-500/10' : 'bg-white/5',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={
              isTooFar || isTooSoon ? 'text-red-300 font-medium' : 'text-white font-medium'
            }
          >
            {displayDate}
          </span>
          <span className="text-white/30 mx-1">·</span>
          <span
            className={
              isTooFar || isTooSoon ? 'text-red-300 font-medium' : 'text-white font-medium'
            }
          >
            {displayTime}
          </span>
        </div>
        <svg
          className={[
            'w-3.5 h-3.5 text-white/30 transition-transform shrink-0',
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