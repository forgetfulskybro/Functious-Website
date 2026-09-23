import Image from 'next/image';
import { DateTimePicker } from "@/components/ui/DateTimerPicker";
import SelectDropdown from '@/components/ui/SelectDropdown';
import { useState } from "react";

export interface Reminder {
  id: string;
  message: string;
  timestamp: number;
  createdAt: number;
  type: 'guild' | 'dm';
  channelId?: string;
}

export const BIRTHDAY_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const BIRTHDAY_MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function birthdayOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export function BirthdayModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: { month: number; day: number; age: number | null } | null;
  onSave: (month: number, day: number, age: number | null) => Promise<void>;
  onClose: () => void;
}) {
  const [month, setMonth] = useState(initial?.month ?? 1);
  const [day, setDay] = useState(initial?.day ?? 1);
  const [age, setAge] = useState<number | null>(initial?.age ?? null);
  const [saving, setSaving] = useState(false);

  const maxDay = BIRTHDAY_MONTH_DAYS[month - 1];
  const finalDay = Math.min(day, maxDay);

  function selectMonth(m: number) {
    setMonth(m);
    setDay((d) => Math.min(d, BIRTHDAY_MONTH_DAYS[m - 1]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave(month, finalDay, age);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-[#160a0a] border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-base">
              {initial ? 'Edit birthday' : 'Set birthday'}
            </h2>
            <p className="text-white/30 text-xs mt-0.5">Shown in your birthday announcements</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none p-1 rounded-lg hover:bg-white/5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Month</label>
              <SelectDropdown
                label=""
                value={String(month)}
                onChange={(v) => selectMonth(parseInt(v, 10))}
                options={BIRTHDAY_MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs font-medium mb-1.5">Day</label>
              <SelectDropdown
                label=""
                value={String(finalDay)}
                onChange={(v) => setDay(parseInt(v, 10))}
                options={Array.from({ length: maxDay }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                }))}
              />
            </div>
          </div>

          <p className="text-white/35 text-xs tabular-nums">
            {BIRTHDAY_MONTHS[month - 1]} {finalDay}
            {age != null ? ` · ${birthdayOrdinal(age + 1)} birthday` : ''}
          </p>

          <div>
            <label className="block text-white/50 text-xs font-medium mb-1.5">Age (optional)</label>
            {age == null ? (
              <button
                type="button"
                onClick={() => setAge(25)}
                className="text-xs text-orange-warm/80 hover:text-orange-warm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange rounded"
              >
                + Add age
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/[0.04] border border-white/5 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAge((a) => Math.max(1, (a ?? 25) - 1))}
                    className="px-2.5 h-9 text-white/40 hover:text-white hover:bg-white/8 transition-colors text-base leading-none select-none"
                    aria-label="Decrease age"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={age ?? ''}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!isNaN(n)) setAge(Math.max(1, Math.min(150, n)));
                    }}
                    onBlur={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setAge(isNaN(n) ? 1 : Math.max(1, Math.min(150, n)));
                    }}
                    min={1}
                    max={150}
                    className="w-12 bg-transparent text-center text-sm text-white focus:outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAge((a) => Math.min(150, (a ?? 25) + 1))}
                    className="px-2.5 h-9 text-white/40 hover:text-white hover:bg-white/8 transition-colors text-base leading-none select-none"
                    aria-label="Increase age"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setAge(null)}
                  className="text-xs text-white/40 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="text-white/25 text-[10px] mt-1.5">
              Your age is shown in announcements (e.g. turning 24)
            </p>
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
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Set birthday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BirthdayPreviewModal({
  avatarUrl,
  displayName,
  month,
  day,
  age,
  ping,
  guildName,
  onClose,
}: {
  avatarUrl: string;
  displayName: string;
  month: number;
  day: number;
  age: number | null;
  ping: boolean;
  guildName: string;
  onClose: () => void;
}) {
  const ageText =
    age != null ? (
      <>
        <strong>{birthdayOrdinal(age + 1)}</strong>{' '}
      </>
    ) : null;

  const Avatar = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt={displayName} className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full" />
  ) : (
    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange/20 text-orange-warm text-xs font-bold">
      {displayName[0]?.toUpperCase()}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#160a0a] border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-white font-bold text-base">Preview announcement</h2>
            <p className="text-white/30 text-xs mt-0.5">
              {BIRTHDAY_MONTHS[month - 1]} {day} · in {guildName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white/70 transition-colors focus-visible:outline-none p-1 rounded-lg hover:bg-white/5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1e1e24]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="text-sm font-medium text-white/40">#</span>
              <span className="text-sm font-semibold text-white/70">birthdays</span>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className="flex gap-3">
                {Avatar}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-white/80">{displayName}</span>
                  </div>
                  <div className="mt-0.5 text-sm leading-relaxed text-white/60">
                    <span className="font-mono text-white/80">f!bday preview</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Image
                  src="/Functious.png"
                  alt="Functious"
                  width={32}
                  height={32}
                  className="mt-0.5 h-8 w-8 flex-shrink-0 rounded-full"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-orange-300">Functious</span>
                    <span className="rounded bg-orange/20 px-1 py-0.5 text-[10px] leading-none text-white/35">
                      BOT
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm leading-relaxed text-white/70">
                    This is a preview
                  </div>
                  {ping && (
                    <div className="mt-1 text-sm">
                      <span className="text-[#00A8FC]">@{displayName}</span>
                    </div>
                  )}

                  <div
                    className="mt-2 max-w-md overflow-hidden rounded border-l-4 p-3"
                    style={{ borderColor: '#A52F05', background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                        {avatarUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="" className="h-4 w-4 rounded-full" />
                        )}
                        {displayName}
                      </p>
                      <p className="text-sm font-semibold text-white">Member Birthday</p>
                      <div className="text-sm leading-relaxed text-white/75">
                        Happy {ageText}birthday from the <strong className="text-white">{guildName}</strong> community!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-white/25 text-[11px] mt-3">
            Shown when this server announces birthdays.
          </p>
        </div>
      </div>
    </div>
  );
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