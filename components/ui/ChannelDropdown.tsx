import { useEffect, useRef, useState } from "react";

export default function ChannelDropdown({
  channels,
  value,
  onChange,
  placeholder = 'Select a channel…',
  types = [0],
}: {
  channels: { id: string; name: string; type?: number }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  types?: number[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  const filteredChannels = channels.filter(c => {
    if (types && types.length > 0 && !types.includes(c.type ?? -1)) return false;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.id.includes(search);
  });

  const selected = channels.find(c => c.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 rounded-lg px-3 py-2.5 text-left  hover:bg-white/8 transition-colors"
      >
        <span className={selected ? 'text-white text-sm truncate' : 'text-white/30 text-sm'}>
          {selected ? `#${selected.name}` : placeholder}
        </span>
        <svg
          className={['w-3.5 h-3.5 text-white/30 transition-transform', open ? 'rotate-180' : ''].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-[100] rounded-xl bg-[#221616] shadow-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-orange"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto pb-2">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
                setSearch('');
              }}
              className="w-full px-4 py-2 text-xs text-left text-white/40 hover:bg-white/5 hover:text-white/70"
            >
              None
            </button>
            {filteredChannels.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-4">No channels found.</p>
            ) : (
              filteredChannels.map(channel => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => {
                    onChange(channel.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={[
                    'w-full flex items-center gap-2 px-4 py-2 text-xs text-left transition-colors',
                    channel.id === value
                      ? 'bg-orange/10 text-orange-warm'
                      : 'text-white/65 hover:bg-white/5 hover:text-white',
                  ].join(' ')}
                >
                  <span className="text-white/40">{channel.type === 4 ? '📁' : '#'}</span>
                  <span className="truncate font-medium">{channel.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}