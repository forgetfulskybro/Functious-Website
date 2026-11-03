export function SourceTarget({
  code,
  className = '',
}: {
  code: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}
    >
      <span className="text-white/40">EN</span>
      <span className="text-white/25">→</span>
      <span className="text-orange-light">{code.replace('_', '-')}</span>
    </span>
  );
}

export function CoverageBar({
  percent,
  className = '',
}: {
  percent: number;
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, percent));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safe)}
      className={`h-2 w-full overflow-hidden rounded-full bg-white/10 ${className}`}
    >
      <div
        className="h-full rounded-full bg-orange transition-[width] duration-300"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
