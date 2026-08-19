import { useEffect, useState } from "react";
import { DateTimePicker, formatDt } from '@/components/ui/DateTimerPicker';
import { showErrorToast } from '@/components/ui/Toast';
import ChannelDropdown from '@/components/ui/ChannelDropdown';
import RolesDropdown from '@/components/ui/RolesDropdown';
import NumberInput from '@/components/ui/NumberInput';
import { Pagination } from '@/components/ui/Pagination';

export interface GiveawayEntry {
  id: string;
  messageId?: string;
  channelId?: string;
  owner?: string;
  prize: string;
  winners: number;
  pickedWinners?: any[];
  users?: any[];
  time?: string | number;
  now?: string | number;
  endDate?: string;
  requirement?: string | null;
  lang?: string;
  ended?: boolean;
  dmWinners?: boolean;
  pingWinners?: boolean;
  allowMultipleWins?: boolean;
  imageUrl?: string | null;
  bonusEntries?: { roleId: string; entries: number }[];
}

function defaultEndTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return formatDt(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes()
  );
}

function endTimeToDuration(timestampStr: string): string | null {
  const endMs = new Date(timestampStr).getTime();
  if (!Number.isFinite(endMs)) return null;

  const diffMs = endMs - Date.now();
  if (diffMs < 120_000) return null;

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes < 1) return null;

  if (totalMinutes % (60 * 24) === 0) return `${totalMinutes / (60 * 24)}d`;
  if (totalMinutes % 60 === 0) return `${totalMinutes / 60}h`;
  return `${totalMinutes}m`;
}

const BONUS_PAGE_SIZE = 3;

export function CreateGiveawayModal({
  channels,
  guildRoles,
  busy,
  onSave,
  onClose,
}: {
  channels: { id: string; name: string; type: number; parentId: string }[];
  guildRoles: { id: string; name: string }[];
  busy?: boolean;
  onSave: (payload: {
    channelId: string;
    prize: string;
    winners: number;
    duration: string;
    requirement?: string;
    dmWinners?: boolean;
    pingWinners?: boolean;
    allowMultipleWins?: boolean;
    imageUrl?: string;
    bonusEntries?: { roleId: string; entries: number }[];
  }) => void | Promise<void>;
  onClose: () => void;
}) {
  const [channelId, setChannelId] = useState('');
  const [prize, setPrize] = useState('');
  const [winners, setWinners] = useState(1);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [requirement, setRequirement] = useState('');
  const [dmWinners, setDmWinners] = useState(false);
  const [pingWinners, setPingWinners] = useState(true);
  const [allowMultipleWins, setAllowMultipleWins] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [bonusEntries, setBonusEntries] = useState<{ roleId: string; entries: number }[]>([]);
  const [bonusPage, setBonusPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const totalBonusPages = Math.max(1, Math.ceil(bonusEntries.length / BONUS_PAGE_SIZE));
  const pagedBonusEntries = bonusEntries.slice(
    bonusPage * BONUS_PAGE_SIZE,
    bonusPage * BONUS_PAGE_SIZE + BONUS_PAGE_SIZE
  );

  useEffect(() => {
    if (bonusPage > totalBonusPages - 1) {
      setBonusPage(Math.max(0, totalBonusPages - 1));
    }
  }, [bonusEntries.length, bonusPage, totalBonusPages]);

  const addBonusEntry = () => {
    if (bonusEntries.length >= 20) return;
    setBonusEntries((prev) => {
      const next = [...prev, { roleId: '', entries: 2 }];
      setBonusPage(Math.floor(next.length / BONUS_PAGE_SIZE));
      return next;
    });
  };

  const updateBonusEntry = (index: number, field: 'roleId' | 'entries', value: string | number) => {
    setBonusEntries((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const removeBonusEntry = (index: number) => {
    setBonusEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !prize.trim() || winners < 1) return;
    if (submitting || busy) return;

    const duration = endTimeToDuration(endTime);
    if (!duration) {
      showErrorToast('Error', {
        description: 'Please choose an end time at least 2 minutes from now.',
      });
      return;
    }

    const validBonusEntries = bonusEntries.filter(
      (b) => b.roleId.trim() && b.entries >= 1
    );

    try {
      setSubmitting(true);
      await onSave({
        channelId,
        prize: prize.trim().slice(0, 500),
        winners: Math.min(50, Math.max(1, winners)),
        duration,
        requirement: requirement.trim() || undefined,
        dmWinners,
        pingWinners,
        allowMultipleWins,
        imageUrl: imageUrl.trim() || undefined,
        bonusEntries: validBonusEntries.length ? validBonusEntries : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || !!busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />

      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-5 pb-3 pt-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-white">Create New Giveaway</h2>
            <p className="mt-0.5 text-xs text-white/30">
              The bot will post it in the selected channel
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="text-xl leading-none text-white/40 hover:text-white disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Channel</label>
                <ChannelDropdown
                  channels={channels}
                  value={channelId}
                  onChangeAction={setChannelId}
                  types={[0]}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">Winners</label>
                <NumberInput
                  value={winners}
                  onChange={setWinners}
                  min={1}
                  max={50}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Prize</label>
              <input
                type="text"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="Fluxer Plutonium / $50 Steam Gift Card"
                maxLength={500}
                className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/50">Ends at</label>
              <DateTimePicker value={endTime} onChangeAction={setEndTime} />
              <p className="mt-1 text-[10px] text-white/25">Must be at least 2 minutes from now</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Requirement <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="text"
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Must boost the server"
                  maxLength={500}
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/50">
                  Banner Image <span className="text-white/25">(optional)</span>
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.png"
                  className="w-full rounded-lg bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange"
                />
              </div>
            </div>

            <div className="rounded-xl bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white/50">Bonus Entries by Role</p>
                  <p className="text-[10px] text-white/25">
                    Users with these roles get extra entries
                    {bonusEntries.length > 0 && (
                      <span className="ml-1 text-white/20">({bonusEntries.length})</span>
                    )}
                  </p>
                </div>
                {bonusEntries.length < 20 && (
                  <button
                    type="button"
                    onClick={addBonusEntry}
                    className="rounded bg-orange/10 px-2 py-0.5 text-xs text-orange-warm transition-colors hover:bg-orange/20 hover:text-orange"
                  >
                    + Add
                  </button>
                )}
              </div>

              {bonusEntries.length === 0 ? (
                <p className="py-1 text-xs text-white/20">No bonus entries configured.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {pagedBonusEntries.map((entry, localIndex) => {
                      const i = bonusPage * BONUS_PAGE_SIZE + localIndex;
                      return (
                        <div key={`bonus-${i}-${entry.roleId || 'empty'}`} className="flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <RolesDropdown
                              roles={guildRoles}
                              value={entry.roleId}
                              onChange={(id) => updateBonusEntry(i, 'roleId', id)}
                              placeholder="Select a role…"
                            />
                          </div>
                          <div className="w-24 flex-shrink-0">
                            <NumberInput
                              value={entry.entries}
                              onChange={(n) => updateBonusEntry(i, 'entries', n)}
                              min={1}
                              max={100}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBonusEntry(i)}
                            className="rounded-md p-1.5 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <Pagination
                    page={bonusPage}
                    totalPages={totalBonusPages}
                    total={bonusEntries.length}
                    pageSize={BONUS_PAGE_SIZE}
                    onChange={setBonusPage}
                  />
                </>
              )}
            </div>

            <div className="space-y-2.5 rounded-xl bg-white/[0.03] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Options</p>

              {([
                { label: 'Ping winners', sub: 'Mention winners in channel on end', val: pingWinners, set: setPingWinners },
                { label: 'DM winners', sub: 'Send each winner a direct message', val: dmWinners, set: setDmWinners },
                { label: 'Allow multiple wins', sub: 'One user can win more than one slot', val: allowMultipleWins, set: setAllowMultipleWins },
              ] as const).map(({ label, sub, val, set }) => (
                <label key={label} className="flex cursor-pointer items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-white/80">{label}</p>
                    <p className="text-xs text-white/30">{sub}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set((v: boolean) => !v)}
                    className={`relative h-5 w-10 flex-shrink-0 rounded-full transition-colors ${val ? 'bg-orange' : 'bg-white/10'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${val ? 'translate-x-5' : ''}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-shrink-0 gap-3 border-t border-[#2A1313] px-5 pb-5 pt-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!channelId || !prize.trim() || !endTime || isBusy}
              className="flex-1 rounded-xl bg-orange py-3 font-semibold text-white transition-colors hover:bg-orange-bright disabled:opacity-50"
            >
              {isBusy ? 'Creating…' : 'Create Giveaway'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeleteGiveawayModal({
  giveaway,
  channelName,
  busy,
  onConfirm,
  onClose,
}: {
  giveaway: GiveawayEntry;
  channelName?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isBusy = deleting || !!busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={isBusy ? undefined : onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Delete giveaway?</h2>
          <p className="mt-0.5 text-xs text-white/30">
            Ends the giveaway and removes the channel message.
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="truncate text-sm font-medium text-white/80">
              {giveaway.prize}
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              {giveaway.winners} winner{giveaway.winners > 1 ? 's' : ''}
              {channelName ? ` • #${channelName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={async () => {
              setDeleting(true);
              try {
                await onConfirm();
              } finally {
                setDeleting(false);
              }
            }}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {isBusy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GiveawayDetailsModal({
  giveaway,
  channelName,
  onClose,
}: {
  giveaway: GiveawayEntry;
  channelName?: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#160a0a] shadow-2xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">Giveaway Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xl text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          <div>
            <p className="text-xs text-white/40">Prize</p>
            <p className="text-lg font-medium text-white">{giveaway.prize}</p>
          </div>

          {giveaway.owner && (
            <div>
              <p className="text-xs text-white/40">Hosted by</p>
              <p className="font-mono text-sm text-orange-warm">{giveaway.owner}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40">Winners</p>
              <p className="text-lg text-white">{giveaway.winners}</p>
            </div>
            <div>
              <p className="text-xs text-white/40">Participants</p>
              <p className="text-lg text-white">{giveaway.users?.length ?? 0}</p>
            </div>
          </div>

          {giveaway.requirement && (
            <div>
              <p className="text-xs text-white/40">Requirement</p>
              <p className="text-sm text-white">{giveaway.requirement}</p>
            </div>
          )}

          {(channelName || giveaway.channelId) && (
            <div>
              <p className="text-xs text-white/40">Channel</p>
              <p className="text-white">#{channelName || giveaway.channelId}</p>
            </div>
          )}

          <div className="space-y-2 rounded-xl bg-white/[0.03] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Settings</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-white/30">Ping winners</p>
                <p className={`text-xs font-medium ${giveaway.pingWinners !== false ? 'text-green-400' : 'text-white/40'}`}>
                  {giveaway.pingWinners !== false ? 'On' : 'Off'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">DM winners</p>
                <p className={`text-xs font-medium ${giveaway.dmWinners ? 'text-green-400' : 'text-white/40'}`}>
                  {giveaway.dmWinners ? 'On' : 'Off'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-white/30">Multi-win</p>
                <p className={`text-xs font-medium ${giveaway.allowMultipleWins ? 'text-orange-warm' : 'text-white/40'}`}>
                  {giveaway.allowMultipleWins ? 'On' : 'Off'}
                </p>
              </div>
            </div>
          </div>

          {giveaway.bonusEntries && giveaway.bonusEntries.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-white/40">Bonus Entries</p>
              <div className="space-y-1">
                {giveaway.bonusEntries.map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-1.5">
                    <p className="font-mono text-xs text-white/60">{b.roleId}</p>
                    <p className="text-xs text-orange-warm">+{b.entries}x</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {giveaway.imageUrl && (
            <div>
              <p className="mb-1 text-xs text-white/40">Banner Image</p>
              <img
                src={giveaway.imageUrl}
                alt="Giveaway banner"
                className="max-h-40 w-full rounded-lg object-cover"
              />
            </div>
          )}

          {giveaway.messageId && (
            <div>
              <p className="text-xs text-white/40">Message ID</p>
              <p className="font-mono text-xs text-white/60">{giveaway.messageId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}