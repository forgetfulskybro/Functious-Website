'use client';

interface CommandSearchProps {
  value: string;
  onSearchAction: (value: string) => void;
  placeholder?: string;
}

export default function CommandSearch({
  value,
  onSearchAction,
  placeholder = 'Search commands…',
}: CommandSearchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="command-search"
        className="text-sm font-medium text-white/70"
      >
        Search commands
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          aria-hidden="true"
        >
          🔍
        </span>
        <input
          id="command-search"
          type="search"
          value={value}
          onChange={(e) => onSearchAction(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-bg-card py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
          aria-label="Search commands"
        />
      </div>
    </div>
  );
}
