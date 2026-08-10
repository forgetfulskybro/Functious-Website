'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export function normalizeHex(input: string): string | null {
  let s = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) {
    s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  }
  if (!/^[0-9a-f]{6}$/.test(s)) return null;
  return `#${s}`;
}

export function toDisplayHex(input: string, fallback = '#A52F05'): string {
  return normalizeHex(input) ?? fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = toDisplayHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s, v };
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;

  if (h < 60) [rp, gp, bp] = [c, x, 0];
  else if (h < 120) [rp, gp, bp] = [x, c, 0];
  else if (h < 180) [rp, gp, bp] = [0, c, x];
  else if (h < 240) [rp, gp, bp] = [0, x, c];
  else if (h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  };
}

function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  fallback?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function ColorPicker({
  value,
  onChange,
  fallback = '#A52F05',
  placeholder = '#A52F05',
  disabled,
  className = '',
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value?.replace(/^#/, '') || '');
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const resolved = toDisplayHex(value || '', fallback);
  const initialHsv = rgbToHsv(...Object.values(hexToRgb(resolved)) as [number, number, number]);
  const [hue, setHue] = useState(initialHsv.h);
  const [sat, setSat] = useState(initialHsv.s);
  const [val, setVal] = useState(initialHsv.v);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'sv' | 'hue' | null>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    if (dragging.current) return;
    const hex = normalizeHex(value || '');
    if (!hex) return;
    const { r, g, b } = hexToRgb(hex);
    const next = rgbToHsv(r, g, b);
    setHue(next.h);
    setSat(next.s);
    setVal(next.v);
  }, [value]);

  useEffect(() => {
    if (!open) {
      setDraft((value || '').replace(/^#/, ''));
    }
  }, [value, open]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    function updatePosition() {
      const rect = triggerRef.current!.getBoundingClientRect();
      const width = 240;
      const gap = 4;
    
      const panelEl = document.getElementById('color-picker-panel');
      const panelHeight = panelEl?.offsetHeight || 220;
    
      let left = rect.left;
      if (left + width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - width - 8);
      }
      if (left < 8) left = 8;
    
      let top = rect.bottom + gap;
          if (top + panelHeight > window.innerHeight - 8) {
        const above = rect.top - panelHeight - gap;
        if (above >= 8) {
          top = above;
        } else {
          top = Math.max(8, window.innerHeight - panelHeight - 8);
        }
      }
    
      setCoords({ top, left });
    }
    
    updatePosition();
      const raf = requestAnimationFrame(updatePosition);
    
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [open]);

  const commitDraft = useCallback(() => {
    const next = normalizeHex(draft);
    if (next) {
      onChange(next);
      setDraft(next.replace(/^#/, ''));
      const { r, g, b } = hexToRgb(next);
      const hsv = rgbToHsv(r, g, b);
      setHue(hsv.h);
      setSat(hsv.s);
      setVal(hsv.v);
    } else if (!draft.trim()) {
      onChange('');
      setDraft('');
    } else {
      setDraft((value || '').replace(/^#/, ''));
    }
  }, [draft, onChange, value]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      const panel = document.getElementById('color-picker-panel');
      if (panel?.contains(target)) return;
      commitDraft();
      setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, commitDraft]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDraft((value || '').replace(/^#/, ''));
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, value]);

  function applyHsv(h: number, s: number, v: number) {
    const hex = hsvToHex(h, s, v);
    onChange(hex);
    setDraft(hex.replace(/^#/, ''));
  }

  function applyHex(hex: string) {
    const next = normalizeHex(hex);
    if (!next) return;
    onChange(next);
    setDraft(next.replace(/^#/, ''));
    const { r, g, b } = hexToRgb(next);
    const hsv = rgbToHsv(r, g, b);
    setHue(hsv.h);
    setSat(hsv.s);
    setVal(hsv.v);
  }

  function pointerToSv(clientX: number, clientY: number) {
    const el = svRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setSat(s);
    setVal(v);
    applyHsv(hue, s, v);
  }

  function pointerToHue(clientX: number) {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    setHue(h);
    applyHsv(h, sat, val);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (dragging.current === 'sv') pointerToSv(e.clientX, e.clientY);
      if (dragging.current === 'hue') pointerToHue(e.clientX);
    }
    function onUp() {
      dragging.current = null;
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  });

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9a-fA-F#]/g, '').slice(0, 7);
    setDraft(raw.replace(/^#/, ''));
  }

  function handleDraftKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitDraft();
      setOpen(false);
    }
  }

  const hueColor = hsvToHex(hue, 1, 1);

  const panel =
    open &&
    coords &&
    createPortal(
      <div
        id="color-picker-panel"
        className="fixed w-[240px] rounded-xl bg-[#1a0e0e] border border-white/10 shadow-2xl overflow-hidden select-none"
        style={{ top: coords.top, left: coords.left, zIndex: 9999 }}
      >
        <div className="p-3 pb-2">
          <div
            ref={svRef}
            onPointerDown={(e) => {
              e.preventDefault();
              dragging.current = 'sv';
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              pointerToSv(e.clientX, e.clientY);
            }}
            className="relative w-full h-36 rounded-lg overflow-hidden border border-white/10 cursor-crosshair touch-none"
            style={{ backgroundColor: hueColor }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, #fff, transparent)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent, #000)',
              }}
            />
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] pointer-events-none"
              style={{
                left: `${sat * 100}%`,
                top: `${(1 - val) * 100}%`,
                backgroundColor: hsvToHex(hue, sat, val),
              }}
            />
          </div>

          <div
            ref={hueRef}
            onPointerDown={(e) => {
              e.preventDefault();
              dragging.current = 'hue';
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              pointerToHue(e.clientX);
            }}
            className="relative w-full h-3 mt-2.5 rounded-full overflow-hidden cursor-pointer touch-none border border-white/10"
            style={{
              background:
                'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)] pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                backgroundColor: hueColor,
              }}
            />
          </div>
        </div>

        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          <p className="text-white/30 text-[10px] uppercase tracking-widest mb-1.5">Hex</p>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md border border-white/10 flex-shrink-0"
              style={{ backgroundColor: normalizeHex(draft) ?? resolved }}
            />
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">
                #
              </span>
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={handleDraftChange}
                onBlur={commitDraft}
                onKeyDown={handleDraftKeyDown}
                placeholder={placeholder.replace(/^#/, '')}
                spellCheck={false}
                className="w-full bg-white/5 rounded-lg pl-6 pr-2.5 py-2 text-sm text-white font-mono placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange uppercase"
              />
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
          'w-full h-10 min-h-[40px] flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 text-sm transition-colors',
          'hover:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-orange',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open ? 'ring-1 ring-orange bg-white/[0.07]' : '',
        ].join(' ')}
      >
        <span
          className="w-6 h-6 rounded-md border border-white/10 flex-shrink-0 shadow-inner"
          style={{ backgroundColor: resolved }}
        />
        <span className="font-mono text-white/80 uppercase tracking-wide">
          {value ? (
            toDisplayHex(value)
          ) : (
            <span className="text-white/30 normal-case tracking-normal">{placeholder}</span>
          )}
        </span>
        <svg
          className={[
            'ml-auto w-3 h-3 text-white/30 transition-transform',
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