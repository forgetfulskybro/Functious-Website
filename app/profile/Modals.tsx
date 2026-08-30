import { DateTimePicker } from "@/components/ui/DateTimerPicker";
import { useState } from "react";

export interface Reminder {
  id: string;
  message: string;
  timestamp: number;
  createdAt: number;
  type: 'guild' | 'dm';
  channelId?: string;
}

export function ReminderModal({
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

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!message.trim() || !datetime) return;
    setSaving(true);
    const ts = Math.floor(new Date(datetime).getTime() / 1000);
    await onSave(message.trim(), ts);
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-base">
              {initial ? 'Edit reminder' : 'New reminder'}
            </h2>
            {!initial && (
              <p className="text-white/30 text-xs mt-0.5">Will be sent to you via DM</p>
            )}
            {isGuild && (
              <p className="text-white/30 text-xs mt-0.5">
                Guild reminder · sent in{' '}
                <span className="font-mono text-orange-light/60">
                  #{initial?.channelId ?? 'channel'}
                </span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none p-1 rounded-lg hover:bg-white/5"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={400}
              rows={3}
              placeholder="What do you want to be reminded about?"
              className="w-full bg-white/[0.04] border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:ring-2 focus:ring-orange/50"
              required
            />
            <p
              className={[
                'text-xs mt-1.5 text-right tabular-nums',
                message.length >= 380 ? 'text-orange-light/70' : 'text-white/20',
              ].join(' ')}
            >
              {message.length}/400
            </p>
          </div>
          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Remind at</label>
            <DateTimePicker value={datetime} onChangeAction={setDatetime} />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/8 text-white/60 hover:text-white/90 text-sm transition-colors focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-orange hover:bg-orange-bright disabled:opacity-50 text-white font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}