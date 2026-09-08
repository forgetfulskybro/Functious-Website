'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { showErrorToast } from '@/components/ui/Toast';
import ColorPicker, { normalizeHex, toDisplayHex } from '@/components/ui/ColorPicker';

function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  const num = parseInt(hex.slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function roundedIconMask(
  x: number, y: number,
  iconX: number, iconY: number, iconSize: number,
  radius: number, feather: number
): number {
  const localX = x - iconX;
  const localY = y - iconY;

  if (
    localX < -feather || localY < -feather ||
    localX >= iconSize + feather || localY >= iconSize + feather
  ) return 0;

  let dist = 0;
  const inLeft = localX < radius;
  const inRight = localX > iconSize - radius;
  const inTop = localY < radius;
  const inBottom = localY > iconSize - radius;

  if (inLeft && inTop) {
    const dx = radius - localX;
    const dy = radius - localY;
    dist = Math.sqrt(dx * dx + dy * dy) - radius;
  } else if (inRight && inTop) {
    const dx = localX - (iconSize - radius);
    const dy = radius - localY;
    dist = Math.sqrt(dx * dx + dy * dy) - radius;
  } else if (inLeft && inBottom) {
    const dx = radius - localX;
    const dy = localY - (iconSize - radius);
    dist = Math.sqrt(dx * dx + dy * dy) - radius;
  } else if (inRight && inBottom) {
    const dx = localX - (iconSize - radius);
    const dy = localY - (iconSize - radius);
    dist = Math.sqrt(dx * dx + dy * dy) - radius;
  } else {
    if (localX < 0) dist = -localX;
    else if (localX >= iconSize) dist = localX - (iconSize - 1);
    else if (localY < 0) dist = -localY;
    else if (localY >= iconSize) dist = localY - (iconSize - 1);
    else dist = 0;
  }

  if (dist <= 0) return 1;
  if (dist >= feather) return 0;
  return 1 - dist / feather;
}

async function recolorImage(
  source: HTMLImageElement,
  hex: string,
  mode: 'avatar' | 'banner'
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = source.naturalWidth || source.width;
  canvas.height = source.naturalHeight || source.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0);

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const [baseR, baseG, baseB] = hexToRgb(hex);
  const [h, s] = rgbToHsl(baseR, baseG, baseB);

  if (mode === 'avatar') {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue;
      const gray = data[i] / 255;
      const newL = 0.12 + gray * 0.78;
      const [nr, ng, nb] = hslToRgb(h, s, Math.min(0.92, newL));
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }
  } else {
    const iconSize = Math.round(height * 0.52);
    const iconX = Math.round(width * 0.028) + 14.5;
    const iconY = Math.round((height - iconSize) / 2);
    const radius = Math.round(iconSize * 0.12);
    const feather = Math.max(2, Math.round(iconSize * 0.03));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] === 0) continue;

        const gray = data[i] / 255;
        const mask = roundedIconMask(x, y, iconX, iconY, iconSize, radius, feather);

        const iconL = 0.12 + gray * 0.78;
        const [iR, iG, iB] = hslToRgb(h, s, Math.min(0.92, iconL));

        let bR: number, bG: number, bB: number;
        if (gray >= 0.62) {
          const newL = 0.72 + (gray - 0.62) * 0.7;
          [bR, bG, bB] = hslToRgb(h, Math.min(s * 0.12, 0.15), Math.min(0.98, newL));
        } else {
          const newL = 0.04 + gray * 0.38;
          const sat = s * (0.55 + gray * 0.35);
          [bR, bG, bB] = hslToRgb(h, sat, newL);
        }

        data[i]     = Math.round(iR * mask + bR * (1 - mask));
        data[i + 1] = Math.round(iG * mask + bG * (1 - mask));
        data[i + 2] = Math.round(iB * mask + bB * (1 - mask));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

const DEFAULT_HEX = '#A52F05';
const GRAY_AVATAR = '/functious grayscale.png';
const GRAY_BANNER = '/functious-banner-grayscale.png';
const DEFAULT_AVATAR = '/Functious.png';
const DEFAULT_BANNER = '/functious-banner.png';

interface Props {
  guildId: string;
  currentTheme: string;
  onClose: () => void;
  onSaved: (hex: string) => void;
}

export function ThemeModal({ guildId, currentTheme, onClose, onSaved }: Props) {
  const [hex, setHex] = useState(toDisplayHex(currentTheme || '', DEFAULT_HEX));
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grayAvatarRef = useRef<HTMLImageElement | null>(null);
  const grayBannerRef = useRef<HTMLImageElement | null>(null);
  const defaultAvatarRef = useRef<HTMLImageElement | null>(null);
  const defaultBannerRef = useRef<HTMLImageElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    Promise.all([
      load(GRAY_AVATAR),
      load(GRAY_BANNER),
      load(DEFAULT_AVATAR),
      load(DEFAULT_BANNER),
    ])
      .then(([ga, gb, da, db]) => {
        grayAvatarRef.current = ga;
        grayBannerRef.current = gb;
        defaultAvatarRef.current = da;
        defaultBannerRef.current = db;
        renderPreviews(hex);
      })
      .catch(() => setError('Failed to load theme assets'));
  }, []);

  const renderPreviews = useCallback(async (color: string) => {
    if (!grayAvatarRef.current || !grayBannerRef.current) return;
    setRendering(true);
    try {
      const isDefault = color.toUpperCase() === DEFAULT_HEX;
      if (isDefault && defaultAvatarRef.current && defaultBannerRef.current) {
        setAvatarPreview(defaultAvatarRef.current.src);
        setBannerPreview(defaultBannerRef.current.src);
      } else {
        const [av, bn] = await Promise.all([
          recolorImage(grayAvatarRef.current, color, 'avatar'),
          recolorImage(grayBannerRef.current, color, 'banner'),
        ]);
        setAvatarPreview(av);
        setBannerPreview(bn);
      }
    } catch (e) {
      console.error(e);
      setError('Preview render failed');
    } finally {
      setRendering(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const normalized = normalizeHex(hex);
      if (normalized) {
        setError(null);
        renderPreviews(normalized);
      }
    }, 120);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [hex, renderPreviews]);

  const handleSave = async () => {
    const normalized = normalizeHex(hex);
    if (!normalized) {
      setError('Invalid color');
      return;
    }
    if (saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/theme`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: normalized }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update theme');
      }

      onSaved(normalized);
    } catch (e: any) {
      showErrorToast('Error', { description: e?.message || 'Could not update theme' });
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || rendering;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#160a0a] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#2A1313]">
          <div>
            <h2 className="text-white font-bold text-lg">Theme</h2>
            <p className="text-white/30 text-xs mt-0.5">
              Change the bot’s avatar, banner & accent color
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-white/40 hover:text-white text-xl disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">
              Color
            </label>
            <ColorPicker
              value={hex}
              onChange={setHex}
              fallback={DEFAULT_HEX}
              placeholder={DEFAULT_HEX}
              disabled={busy}
            />
            {error && (
              <p className="text-red-400/90 text-xs mt-1.5">{error}</p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
              Preview
            </p>

            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5">
              <div className="relative w-full aspect-[3/1] bg-[#1a0e0e]">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">
                    {rendering ? 'Rendering…' : 'Loading assets…'}
                  </div>
                )}
              </div>

              <div className="flex items-end gap-3 px-4 pb-4 -mt-8 relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-[#160a0a] bg-[#1a0e0e] shadow-lg flex-shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
                      …
                    </div>
                  )}
                </div>
                <div className="pb-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">Functious</p>
                  <p className="text-white/40 text-xs font-mono">{toDisplayHex(hex)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              '#A52F05',
              '#E85D04',
              '#DC2F02',
              '#9B2226',
              '#370617',
              '#48CAE4',
              '#80FFDB',
            ].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setHex(c)}
                disabled={busy}
                className="w-8 h-8 rounded-lg border border-white/10 hover:scale-110 transition-transform disabled:opacity-50"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!normalizeHex(hex) || busy}
              className="flex-1 py-3 bg-orange hover:bg-orange-bright disabled:opacity-50 rounded-xl font-semibold text-white transition-colors"
            >
              {saving ? 'Updating…' : 'Save Theme'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}