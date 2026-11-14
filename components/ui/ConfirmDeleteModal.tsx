'use client';

import type { ReactNode } from 'react';

export default function ConfirmDeleteModal({
  title,
  description,
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  busy = false,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  busyLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[#160a0a] shadow-2xl">
        <div className="border-b border-[#2A1313] px-6 pb-4 pt-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-white/30">{description}</p>
        </div>

        {children && <div className="px-6 pt-5">{children}</div>}

        <div className="flex gap-3 px-6 pb-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl bg-white/5 py-3 font-medium text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-xl bg-red-500/15 py-3 font-semibold text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
