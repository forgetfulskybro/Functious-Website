import { getPollLayout, getPollTheme } from './pollAppearance';
import type { PollThemePalette as Palette } from './pollAppearance';

const OPTIONS = [
  { label: 'Option A', votes: 8 },
  { label: 'Option B', votes: 5 },
  { label: 'Option C', votes: 3 },
  { label: 'Option D', votes: 2 },
];
const TOTAL_VOTES = OPTIONS.reduce((sum, option) => sum + option.votes, 0);

function percentage(votes: number) {
  return TOTAL_VOTES > 0 ? Math.floor((votes / TOTAL_VOTES) * 1000) / 10 : 0;
}

function fraction(votes: number) {
  return TOTAL_VOTES > 0 ? votes / TOTAL_VOTES : 0;
}

function Bars({ palette, compact }: { palette: Palette; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
      {OPTIONS.map((option, index) => (
        <div
          key={option.label}
          className={[
            'relative overflow-hidden',
            compact ? 'h-7 rounded-md' : 'h-10 rounded-lg',
          ].join(' ')}
          style={{ backgroundColor: palette.panel }}
        >
          <div
            className="absolute inset-y-0 left-0"
            style={{ width: `${fraction(option.votes) * 100}%`, backgroundColor: palette.accent }}
          />
          <div className="relative flex h-full items-center gap-2 px-2.5">
            <span
              className={compact ? 'text-xs' : 'text-sm'}
              style={{ color: palette.muted }}
            >
              {index + 1}
            </span>
            <span
              className={`flex-1 truncate ${compact ? 'text-[15px]' : 'text-[17px]'}`}
              style={{ color: palette.text }}
            >
              {option.label}
            </span>
            <span
              className={`shrink-0 rounded px-1 py-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}
              style={{ backgroundColor: palette.panel, color: palette.text }}
            >
              {percentage(option.votes)}% ({option.votes})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Minimal({ palette }: { palette: Palette }) {
  return (
    <div className="space-y-2">
      {OPTIONS.map((option, index) => (
        <div key={option.label}>
          <div className="flex items-center gap-2.5 text-[15px]">
            <span className="w-4 text-center" style={{ color: palette.muted }}>
              {index + 1}
            </span>
            <span className="flex-1 truncate" style={{ color: palette.text }}>
              {option.label}
            </span>
            <span className="shrink-0 text-xs" style={{ color: palette.muted }}>
              {percentage(option.votes)}% ({option.votes})
            </span>
          </div>
          <div
            className="ml-6 mt-1 h-1 rounded-full"
            style={{ backgroundColor: palette.panel }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${fraction(option.votes) * 100}%`,
                backgroundColor: palette.accent,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Cards({ palette }: { palette: Palette }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map((option, index) => (
        <div
          key={option.label}
          className="rounded-lg p-3"
          style={{ backgroundColor: palette.panel }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <span className="pt-0.5 text-xs" style={{ color: palette.muted }}>
                {index + 1}
              </span>
              <span
                className="truncate text-[15px]"
                style={{ color: palette.text }}
              >
                {option.label}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-base" style={{ color: palette.text }}>
                {percentage(option.votes)}%
              </div>
              <div className="text-[11px]" style={{ color: palette.muted }}>
                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
              </div>
            </div>
          </div>
          <div
            className="mt-2 h-[5px] rounded-full"
            style={{ backgroundColor: palette.background }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${fraction(option.votes) * 100}%`,
                backgroundColor: palette.accent,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PollPreview({ theme, layout }: { theme: string; layout: string }) {
  const palette = getPollTheme(theme).palette;
  const layoutKey = getPollLayout(layout).value;

  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{ backgroundColor: palette.background }}
    >
      <p className="text-[17px] leading-snug" style={{ color: palette.text }}>
        Which option do you prefer?
      </p>

      <div className="mt-4">
        {layoutKey === 'cards' ? (
          <Cards palette={palette} />
        ) : layoutKey === 'minimal' ? (
          <Minimal palette={palette} />
        ) : (
          <Bars palette={palette} compact={layoutKey === 'compact'} />
        )}
      </div>

      <div
        className="mt-4 border-t-2 pt-2.5 text-[17px]"
        style={{ borderColor: palette.muted, color: palette.text }}
      >
        {TOTAL_VOTES} votes
      </div>
    </div>
  );
}
