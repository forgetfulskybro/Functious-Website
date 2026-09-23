'use client';

import { useEffect, useRef } from 'react';

const ITEM_H = 32;

export default function ScrollWheel({
  items,
  selected,
  onSelect,
}: {
  items: { value: number; label: string }[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = items.findIndex((i) => i.value === selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    }
  }, [selected, items]);

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
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